'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// --- GROUP ACTIONS ---

export async function createChatGroup(projectId: string, name: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("ai_chat_groups")
    .insert({ project_id: projectId, user_id: user.id, name })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, group: data };
}

export async function deleteChatGroup(groupId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("ai_chat_groups").delete().eq("id", groupId);
  if (error) return { error: error.message };
  return { success: true };
}

// --- GENERATE RESPONSE ---

export async function deleteChat(chatId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Deletes the chat and cascades the deletion to all associated messages
  const { error } = await supabase
    .from("ai_chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", user.id); // Security check

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateChatGroup(chatId: string, groupId: string | null) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Note: groupId can be null to move the chat to "Uncategorized"
  const { error } = await supabase
    .from("ai_chats")
    .update({ 
        group_id: groupId, 
        updated_at: new Date().toISOString() 
    })
    .eq("id", chatId)
    .eq("user_id", user.id); // Security check

  if (error) return { error: error.message };
  return { success: true };
}

export async function generateAiResponse(
  projectId: string, 
  prompt: string, 
  chatId?: string,
  groupId?: string,
  modelKey: string = "gemini-3-pro-preview" // Default
) {
  const cookieStore = cookies(); 
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch Token Pack
  const { data: tokenPack } = await supabase
    .from("token_packs")
    .select("*")
    .eq("project_id", projectId)
    .gt("expires_at", new Date().toISOString())
    .order("purchased_at", { ascending: false }) 
    .limit(1)
    .single();

  const getBalance = (pack: any) => {
    if (!pack?.remaining_tokens) return 0;
    let rt = pack.remaining_tokens;
    if (typeof rt === 'string') { try { rt = JSON.parse(rt); } catch(e) {} }
    return (rt.gpt || 0) + (rt.claude || 0) + (rt.custom || 0);
  };

  const currentBalance = getBalance(tokenPack);

  if (!tokenPack || currentBalance <= 0) {
    return { error: "Insufficient tokens." };
  }

  try {
    // 2. USE EXACT MODEL REQUESTED
    // We pass the modelKey directly (e.g., "gemini-3-pro-preview")
    const response = await ai.models.generateContent({
      model: modelKey,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful AI assistant. You must ONLY generate text. Do not generate, create, or describe images. If asked to generate an image, politely decline.",
      }
    });

    const text = response.text || "No response generated";
    const totalTokensUsed = Math.ceil(prompt.length / 4) + Math.ceil(text.length / 4);

    // 3. Handle Database Updates
    let activeChatId = chatId;

    if (!activeChatId) {
        const title = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
        const { data: newChat, error: chatError } = await supabase
            .from("ai_chats")
            .insert({
                project_id: projectId,
                user_id: user.id,
                title: title,
                group_id: groupId || null,
                total_tokens_used: 0
            })
            .select()
            .single();
            
        if (chatError) throw new Error("Failed to create chat session: " + chatError.message);
        activeChatId = newChat.id;
    }

    await supabase.from("ai_messages").insert([
        { chat_id: activeChatId, role: 'user', content: prompt, tokens_used: Math.ceil(prompt.length / 4) },
        { chat_id: activeChatId, role: 'ai', content: text, tokens_used: Math.ceil(text.length / 4) }
    ]);

    const { data: currentChat } = await supabase.from("ai_chats").select("total_tokens_used").eq("id", activeChatId).single();
    const newChatTotal = (currentChat?.total_tokens_used || 0) + totalTokensUsed;

    await supabase.from("ai_chats")
        .update({ total_tokens_used: newChatTotal, updated_at: new Date().toISOString() })
        .eq("id", activeChatId);

    let currentRT = tokenPack.remaining_tokens;
    if (typeof currentRT === 'string') currentRT = JSON.parse(currentRT);

    const newRemaining = {
        ...currentRT,
        custom: Math.max(0, (currentRT.custom || 0) - totalTokensUsed)
    };

    await supabase.from("token_packs").update({ remaining_tokens: newRemaining }).eq("id", tokenPack.id);

    await supabase.from("token_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      token_pack_id: tokenPack.id,
      model: modelKey, 
      tokens_used: totalTokensUsed,
      action: "chat_response",
    });

    return { 
        success: true, 
        chatId: activeChatId, 
        message: text, 
        tokensUsed: totalTokensUsed,
        newBalance: (newRemaining.gpt + newRemaining.claude + newRemaining.custom)
    };

  } catch (error: any) {
    console.error("GenAI SDK Error:", JSON.stringify(error, null, 2));
    return { error: `AI Error: ${error.message || "Model not available"}` };
  }
}