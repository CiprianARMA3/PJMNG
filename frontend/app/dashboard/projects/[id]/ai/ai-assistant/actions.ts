'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// --- GROUP MANAGEMENT ---

export async function createChatGroup(projectId: string, name: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("ai_chat_groups")
    .insert({ 
        project_id: projectId, 
        user_id: user.id, 
        name,
        metadata: { tags: [] } 
    })
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

export async function updateGroupTags(groupId: string, tags: any[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("ai_chat_groups")
    .update({ metadata: { tags: tags } })
    .eq("id", groupId);

  if (error) return { error: error.message };
  return { success: true };
}

// --- CHAT MANAGEMENT ---

export async function deleteChat(chatId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("ai_chats").delete().eq("id", chatId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function renameChat(chatId: string, newTitle: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("ai_chats")
    .update({ title: newTitle, updated_at: new Date().toISOString() })
    .eq("id", chatId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateChatGroup(chatId: string, groupId: string | null) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("ai_chats").update({ group_id: groupId, updated_at: new Date().toISOString() }).eq("id", chatId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

// --- GENERATION LOGIC ---

export async function generateAiResponse(
  projectId: string, 
  prompt: string, 
  chatId?: string,
  groupId?: string,
  modelKey: string = "gemini-3-pro-preview",
  isRegeneration: boolean = false
) {
  const cookieStore = cookies(); 
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const estimatedInputTokens = Math.ceil(prompt.length / 4);
  const MINIMUM_OUTPUT_BUFFER = 50; 
  const requiredTokens = estimatedInputTokens + MINIMUM_OUTPUT_BUFFER;

  const { data: tokenPack } = await supabase
    .from("token_packs")
    .select("*")
    .eq("project_id", projectId)
    .gt("expires_at", new Date().toISOString())
    .order("purchased_at", { ascending: false }) 
    .limit(1)
    .single();

  const parseTokens = (rt: any) => {
    if (!rt) return {};
    if (typeof rt === 'string') { try { return JSON.parse(rt); } catch(e) { return {}; } }
    return rt;
  };

  const remainingTokens = parseTokens(tokenPack?.remaining_tokens);
  const currentModelBalance = remainingTokens[modelKey] || 0;

  if (!tokenPack || currentModelBalance < requiredTokens) {
    return { error: `Insufficient tokens.` };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelKey,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful expert assistant. When writing code, use Markdown code blocks with the language specified. Be concise and professional.",
      }
    });

    const text = response.text || "No response generated";
    const outputTokens = Math.ceil(text.length / 4);
    // If regeneration, we pay for input again (API cost) but we don't store user msg
    const totalTokensUsed = estimatedInputTokens + outputTokens;

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
            
        if (chatError) throw new Error("Failed to create chat session");
        activeChatId = newChat.id;
    }

    // Database Insertions
    const messagesToInsert = [];
    
    // Only insert user message if it's NOT a regeneration
    if (!isRegeneration) {
        messagesToInsert.push({ chat_id: activeChatId, role: 'user', content: prompt, tokens_used: estimatedInputTokens });
    }
    
    messagesToInsert.push({ chat_id: activeChatId, role: 'ai', content: text, tokens_used: outputTokens });

    await supabase.from("ai_messages").insert(messagesToInsert);

    const { data: currentChat } = await supabase.from("ai_chats").select("total_tokens_used").eq("id", activeChatId).single();
    const newChatTotal = (currentChat?.total_tokens_used || 0) + totalTokensUsed;

    await supabase.from("ai_chats").update({ total_tokens_used: newChatTotal, updated_at: new Date().toISOString() }).eq("id", activeChatId);

    const newRemaining = {
        ...remainingTokens,
        [modelKey]: Math.max(0, currentModelBalance - totalTokensUsed)
    };

    await supabase.from("token_packs").update({ remaining_tokens: newRemaining }).eq("id", tokenPack.id);

    await supabase.from("token_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      token_pack_id: tokenPack.id,
      model: modelKey, 
      tokens_used: totalTokensUsed,
      action: isRegeneration ? "chat_regeneration" : "chat_response",
    });

    return { 
        success: true, 
        chatId: activeChatId, 
        message: text, 
        tokensUsed: totalTokensUsed,
        newBalance: newRemaining
    };

  } catch (error: any) {
    console.error("AI Error:", error);
    return { error: `AI Error: ${error.message}` };
  }
}