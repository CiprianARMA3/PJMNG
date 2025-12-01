'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// --- SQL GROUP MANAGEMENT ---

export async function createChatGroup(projectId: string, name: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("ai_sql_chat_groups") // UPDATED TABLE
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
  // UPDATED TABLE
  const { error } = await supabase.from("ai_sql_chat_groups").delete().eq("id", groupId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateGroupTags(groupId: string, tags: any[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  // UPDATED TABLE
  const { error } = await supabase
    .from("ai_sql_chat_groups")
    .update({ metadata: { tags: tags } })
    .eq("id", groupId);

  if (error) return { error: error.message };
  return { success: true };
}

// --- SQL CHAT MANAGEMENT ---

export async function deleteChat(chatId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // UPDATED TABLE
  const { error } = await supabase.from("ai_sql_chats").delete().eq("id", chatId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function renameChat(chatId: string, newTitle: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // UPDATED TABLE
  const { error } = await supabase
    .from("ai_sql_chats")
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

  // UPDATED TABLE
  const { error } = await supabase.from("ai_sql_chats").update({ group_id: groupId, updated_at: new Date().toISOString() }).eq("id", chatId).eq("user_id", user.id);
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

  // Token Logic uses SHARED tables (token_packs, token_usage_logs), so this remains the same
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
systemInstruction: `
You are an expert Senior Database Engineer and SQL Architect. Your goal is to provide precise, optimized, and secure SQL solutions.

**Response Guidelines:**
1.  **Code Formatting:** Always wrap SQL code in Markdown blocks (e.g., \`\`\`sql). Use uppercase for keywords (SELECT, WHERE) and lowercase/snake_case for identifiers.
2.  **Logic Explanation:** Briefly explain *why* you chose a specific approach (e.g., using a JOIN vs. a subquery, or specific indexing strategies).
3.  **Visualization & Data Preview:**
    a. **Schema Table (Mandatory):** For every table involved in the solution, you **MUST** first output a schema summary table showing its structure. Use this exact format:
        | Column Name | Data Type | Constraints | Description/Sample Content |
        | :--- | :--- | :--- | :--- |
        | id | UUID | PK, Default | Unique identifier |
        | user_id | UUID | FK -> users.id | Link to the user |
        | status | TEXT | Check IN ('active', 'archived') | The row status |
    b. **Data Preview Table (Conditional/Wizard Mode):** If the solution includes an **INSERT**, **UPDATE**, or **DELETE** statement, you **MUST** generate a *second* table immediately after the Schema Table.Keep the Primary key! .This table acts as a data preview "wizard" to show the exact data being inserted or affected.
        * **For INSERT Statements:** The table headers must be the column names, and the rows must contain the specific values being inserted.
        * **Example INSERT Preview:**
            | user_id | name | created_at |
            | :--- | :--- | :--- |
            | 4321 | Jane Doe | NOW() |
            | 5432 | John Smith | NOW() |

4.  **Security First:** Always prioritize security. If a user asks for raw queries, suggest parameterized queries or prepared statements to prevent SQL Injection.
5.  **Conciseness:** Be professional and direct. Avoid fluff. Focus on the solution.

**Context Awareness:**
If the user provides a specific RDBMS (PostgreSQL, MySQL, ScyllaDB), adhere strictly to its syntax and best practices (e.g., using JSONB for Postgres vs. JSON for MySQL).
`     }
    });

    const text = response.text || "No response generated";
    const outputTokens = Math.ceil(text.length / 4);
    const totalTokensUsed = estimatedInputTokens + outputTokens;

    let activeChatId = chatId;

    if (!activeChatId) {
        const title = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
        // UPDATED TABLE: ai_sql_chats
        const { data: newChat, error: chatError } = await supabase
            .from("ai_sql_chats")
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

    // --- DATABASE INSERT (SQL Messages) ---
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

    // UPDATED TABLE: ai_sql_messages
    const { error: insertError } = await supabase.from("ai_sql_messages").insert(messagesToInsert);

    if (insertError) {
        console.warn("Insert failed with new columns. Retrying without them...", insertError.message);
        // Fallback for legacy schema compatibility
        const legacyMessages = messagesToInsert.map(({ ai_model, user_id, ...rest }) => rest);
        const { error: legacyError } = await supabase.from("ai_sql_messages").insert(legacyMessages); 
        if (legacyError) throw new Error("Failed to save message: " + legacyError.message);
    }

    // UPDATED TABLE: ai_sql_chats
    const { data: currentChat } = await supabase.from("ai_sql_chats").select("total_tokens_used").eq("id", activeChatId).single();
    const newChatTotal = (currentChat?.total_tokens_used || 0) + totalTokensUsed;

    await supabase.from("ai_sql_chats").update({ total_tokens_used: newChatTotal, updated_at: new Date().toISOString() }).eq("id", activeChatId);

    // Update Tokens (Shared Table)
    const newRemaining = {
        ...remainingTokens,
        [modelKey]: Math.max(0, currentModelBalance - totalTokensUsed)
    };

    await supabase.from("token_packs").update({ remaining_tokens: newRemaining }).eq("id", tokenPack.id);

    // Update Usage Logs (Shared Table)
    await supabase.from("token_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      token_pack_id: tokenPack.id,
      model: modelKey, 
      tokens_used: totalTokensUsed,
      action: isRegeneration ? "sql_chat_regeneration" : "sql_chat_response", 
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