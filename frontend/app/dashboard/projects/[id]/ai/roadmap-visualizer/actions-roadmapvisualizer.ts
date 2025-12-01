'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// --- ROADMAP GROUP MANAGEMENT ---

export async function createChatGroup(projectId: string, name: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("ai_roadmap_chat_groups")
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
  
  const { error } = await supabase.from("ai_roadmap_chat_groups").delete().eq("id", groupId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateGroupTags(groupId: string, tags: any[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { error } = await supabase
    .from("ai_roadmap_chat_groups")
    .update({ metadata: { tags: tags } })
    .eq("id", groupId);

  if (error) return { error: error.message };
  return { success: true };
}

// --- ROADMAP CHAT MANAGEMENT ---

export async function deleteChat(chatId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Logic matches your SQL file: Simple delete.
  // REQUIRES the SQL "ON DELETE CASCADE" fix provided above.
  const { error } = await supabase.from("ai_roadmap_chats").delete().eq("id", chatId).eq("user_id", user.id);
  
  if (error) return { error: error.message };
  return { success: true };
}

export async function renameChat(chatId: string, newTitle: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("ai_roadmap_chats")
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

  const { error } = await supabase.from("ai_roadmap_chats").update({ group_id: groupId, updated_at: new Date().toISOString() }).eq("id", chatId).eq("user_id", user.id);
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

  // 1. Check Tokens (Shared Table)
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
    // 2. Generate Content
    const response = await ai.models.generateContent({
      model: modelKey,
      contents: prompt,
      config: {
systemInstruction: `
You are an expert Senior Product Manager and Technical Architect (ex-Google/Stripe). Your goal is to generate high-precision, technical product roadmaps that identify dependencies and critical paths.

**CRITICAL OUTPUT RULES:**

1.  **The Roadmap Table (The Graph Source):**
    You **MUST** provide a Markdown Table. This table is parsed by a visualization engine.
    *   **Do not** break the table format.
    *   **Do not** put text inside the table that isn't data.
    *   **Column Headers MUST be exactly:** \`| ID | Feature | Type | Timeline | Dependency |\`

    **Column constraints:**
    *   **ID:** Short alphanumeric (1, 2, A, B).
    *   **Feature:** Action-oriented, concise (e.g., "Implement OAuth", "Design Schema"). Max 4 words.
    *   **Type:** STRICTLY one of: **Frontend**, **Backend**, **Design**, **Database**, **DevOps**, **Strategy**, **AI/ML**, **Security**, **Mobile**, **QA**.
    *   **Timeline:** Grouping bucket (e.g., "Sprint 1", "Phase 1", "Q3").
    *   **Dependency:** The **ID** of the blocker. Use "None" for roots. Comma-separated for multiple (e.g., "1, 2").

    *Table Example:*
    | ID | Feature | Type | Timeline | Dependency |
    | :--- | :--- | :--- | :--- | :--- |
    | 1 | Market Analysis | Strategy | Week 1 | None |
    | 2 | Define Schema | Database | Week 1 | 1 |
    | 3 | Train Model | AI/ML | Week 2 | 2 |
    | 4 | Audit Logs | Security | Week 3 | 2 |

2.  **Strategic Context (The "Why"):**
    After the table, provide a concise technical breakdown using these specific headers:
    *   **### 🏗️ Architecture Strategy:** Why this tech stack/order?
    *   **### ⚠️ Risk Analysis:** potential bottlenecks or technical debt.
    *   **### 🚀 MVP Definition:** What constitutes the "V1" release?

3.  **Tone & Style:**
    *   Use the "Graphite.dev" or "Linear" aesthetic: clean, technical, no fluff.
    *   Focus on engineering reality (latency, data integrity) over marketing buzzwords.
`
   }
    });

    const text = response.text || "No response generated";
    const outputTokens = Math.ceil(text.length / 4);
    const totalTokensUsed = estimatedInputTokens + outputTokens;

    let activeChatId = chatId;

    // 3. Create Chat if Needed
    if (!activeChatId) {
        const title = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
        const { data: newChat, error: chatError } = await supabase
            .from("ai_roadmap_chats")
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

    // 4. Insert Messages
    const messagesToInsert: any[] = [];
    
    if (!isRegeneration) {
        messagesToInsert.push({ 
            chat_id: activeChatId, 
            role: 'user', 
            content: prompt, 
            tokens_used: estimatedInputTokens,
            ai_model: null,
            user_id: user.id // <--- ADD THIS LINE
        });
    }
    
    messagesToInsert.push({ 
        chat_id: activeChatId, 
        role: 'ai', 
        content: text, 
        tokens_used: outputTokens, 
        ai_model: modelKey,
        user_id: null // AI has no user_id
    });

    // UPDATED TABLE: ai_roadmap_messages
    const { error: insertError } = await supabase.from("ai_roadmap_messages").insert(messagesToInsert);

    if (insertError) {
        console.warn("Insert failed with new columns. Retrying without them...", insertError.message);
        // Fallback for legacy schema compatibility
        const legacyMessages = messagesToInsert.map(({ ai_model, user_id, ...rest }) => rest);
        const { error: legacyError } = await supabase.from("ai_roadmap_messages").insert(legacyMessages); 
        if (legacyError) throw new Error("Failed to save message: " + legacyError.message);
    }

    // 5. Update Chat Totals
    const { data: currentChat } = await supabase.from("ai_roadmap_chats").select("total_tokens_used").eq("id", activeChatId).single();
    const newChatTotal = (currentChat?.total_tokens_used || 0) + totalTokensUsed;

    await supabase.from("ai_roadmap_chats").update({ total_tokens_used: newChatTotal, updated_at: new Date().toISOString() }).eq("id", activeChatId);

    // 6. Update Tokens (Shared Table)
    const newRemaining = {
        ...remainingTokens,
        [modelKey]: Math.max(0, currentModelBalance - totalTokensUsed)
    };

    await supabase.from("token_packs").update({ remaining_tokens: newRemaining }).eq("id", tokenPack.id);

    // 7. Log Usage (Shared Table - THIS KEEPS YOUR DATA SAFE)
    await supabase.from("token_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      token_pack_id: tokenPack.id,
      model: modelKey, 
      tokens_used: totalTokensUsed,
      action: isRegeneration ? "roadmap_chat_regeneration" : "roadmap_chat_response", 
    });

    return { 
        success: true, 
        chatId: activeChatId, 
        message: text, 
        tokensUsed: totalTokensUsed,
        newBalance: newRemaining,
        ai_model: modelKey
    };

  } catch (error: any) {
    console.error("AI Error:", error);
    return { error: `AI Error: ${error.message}` };
  }
}