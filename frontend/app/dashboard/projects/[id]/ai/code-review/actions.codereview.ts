'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { Octokit } from "@octokit/rest"; 

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// --- CONFIGURATION: MODEL KEYS ---
const DB_MODEL_KEY = "gemini-2.5-pro";
const API_MODEL_KEY = "models/gemini-2.5-pro"; 

// --- CONFIGURATION: REPO FILTERING ---
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.vscode'];
const IGNORED_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', '.env', '.env.local'];
const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar', '.gz'];

// --- CACHE MANAGEMENT ---

async function getActiveCacheKey(projectId: string): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data } = await supabase
    .from("ai_repository_caches")
    .select("cache_key, expires_at")
    .eq("project_id", projectId)
    .single();

  if (data && new Date(data.expires_at!) > new Date()) {
    return data.cache_key;
  }
  return null;
}

async function setCacheKey(projectId: string, cacheKey: string, repoUrl: string, ttlSeconds: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const expiryDate = new Date(Date.now() + ttlSeconds * 1000);

  const { error } = await supabase
    .from("ai_repository_caches")
    .upsert({ 
      project_id: projectId, 
      cache_key: cacheKey, 
      repository_url: repoUrl, 
      expires_at: expiryDate.toISOString() 
    }, { onConflict: 'project_id' }); 

  if (error) console.error("Failed to save cache key to Supabase:", error.message);
}

async function getProjectName(projectId: string): Promise<string> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("projects").select("name").eq("id", projectId).single();
  return data?.name || "Unknown Project";
}

async function createGeminiCache(repoText: string, repoUrl: string, projectId: string) {
const ttlSeconds = 3600; // 1 hour validity
  const projectName = await getProjectName(projectId); 
  
  const cacheConfig = {
    model: API_MODEL_KEY, 
    contents: [{ parts: [{ text: repoText }], role: "user" }],
    displayName: `${projectName} Repo Cache: ${projectId}`, 
    ttl: `${ttlSeconds}s`, 
  };
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${process.env.GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cacheConfig)
  });

  const data = await response.json();
  
  if (data.error) {
    // Specifically handle the "content too small" or "2048 token" error nicely
    if (data.error.message && (data.error.message.includes('too small') || data.error.message.includes('token'))) {
        throw new Error("Repository is too small for context caching (min ~32k tokens). Standard chat will be used.");
    }
    throw new Error("Gemini Cache Creation Failed: " + data.error.message);
  }

  const cacheKey = data.name;
  await setCacheKey(projectId, cacheKey, repoUrl, ttlSeconds);
  return cacheKey;
}

// --- REPO METADATA & FETCHING ---

async function getRepoUrl(projectId: string): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("projects").select("github_repo_url").eq("id", projectId).single();
  return data?.github_repo_url || null;
}

/**
 * Fetches the GitHub PAT from the projects table.
 */
async function getGithubToken(projectId: string): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("projects") 
    .select("github_personalaccesstoken") 
    .eq("id", projectId)
    .single();

  if (error || !data?.github_personalaccesstoken) {
    console.error("Failed to fetch GitHub token for project:", error?.message);
    return null;
  }
  return data.github_personalaccesstoken;
}


function parseGithubUrl(url: string): { owner: string; repo: string } | null {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(p => p.length > 0);
        if (parts.length < 2) return null;
        const repoName = parts[1].replace('.git', '');
        return { owner: parts[0], repo: repoName };
    } catch (e) {
        return null;
    }
}

async function fetchRepoContents(owner: string, repo: string, githubToken: string): Promise<string> {
    console.log(`Fetching contents for ${owner}/${repo}...`);
    
    const octokit = new Octokit({ auth: githubToken });

    // Get the default branch
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // Get the recursive tree
    const { data: treeData } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: 'true'
    });

    let fullText = `Repository Context: ${owner}/${repo}\n\n`;
    let fileCount = 0;

    for (const file of treeData.tree) {
        if (file.type !== 'blob' || !file.path) continue;

        // Skip ignored files/folders
        const isIgnoredDir = IGNORED_DIRS.some(dir => file.path!.includes(`${dir}/`));
        const isIgnoredFile = IGNORED_FILES.includes(file.path!.split('/').pop() || '');
        const isIgnoredExt = IGNORED_EXTENSIONS.some(ext => file.path!.endsWith(ext));

        if (isIgnoredDir || isIgnoredFile || isIgnoredExt) continue;

        // Safety limit (adjust as needed for token costs)
        if (fileCount > 150) { 
            fullText += `\n... (Limit reached, remaining files skipped) ...`;
            break; 
        }

        try {
            const { data: blob } = await octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: file.sha!,
            });

            // Decode Base64 content from GitHub
            const content = Buffer.from(blob.content, 'base64').toString('utf-8');

            fullText += `\n--- FILE: ${file.path} ---\n`;
            fullText += content;
            fullText += `\n--- END FILE ---\n`;
            
            fileCount++;
        } catch (err) {
            console.warn(`Failed to fetch ${file.path}`, err);
        }
    }

    return fullText;
}


export async function syncRepository(projectId: string) { 
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const repoUrl = await getRepoUrl(projectId);
  if (!repoUrl) return { error: "No GitHub repository URL configured." };
  
  const githubToken = await getGithubToken(projectId);
  if (!githubToken) return { error: "GitHub Personal Access Token is missing for this project. Please re-authorize." };

  const repoDetails = parseGithubUrl(repoUrl);
  if (!repoDetails) return { error: "Invalid GitHub URL format." };
  const { owner, repo } = repoDetails;

  // Define repoText variable here so it's accessible in the catch block
  let repoText = ""; 

  try {
    repoText = await fetchRepoContents(owner, repo, githubToken); 

    if (!repoText || repoText.length < 100) {
      return { error: "Repository is empty or fetch failed. Check branch or token scope." };
    }

    const cacheKey = await createGeminiCache(repoText, repoUrl, projectId);
    return { success: true, cacheKey };

  } catch (error: any) {
    // 🚨 MODIFIED HANDLING:
    // If cache fails because repo is too small, we return the text and a specific flag ('strategy: INJECT').
    if (error.message && (error.message.includes("too small") || error.message.includes("token"))) {
        console.log(`[RepoSync] Info: Repo too small for Cache API. Returning text for direct injection.`);
        return { 
            success: false, 
            error: error.message, 
            strategy: 'INJECT', 
            repoText: repoText 
        }; 
    }

    console.error("Sync Error:", error);
    return { error: error.message || "Failed to create AI cache" };
  }
}

export async function getCacheStatus(projectId: string): Promise<string | null> {
    return getActiveCacheKey(projectId);
}


// --- GROUP MANAGEMENT ---

export async function createChatGroup(projectId: string, name: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("ai_code_review_groups") 
    .insert({ 
        project_id: projectId, 
        user_id: user.id, 
        name,
        metadata: { tags: [] } 
    })
    .select()
    .single();

  if (error) {
    console.error("[Supabase Insert Error]:", error.message);
    return { error: error.message };
  }

  return { success: true, group: data };
}

export async function deleteChatGroup(groupId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("ai_code_review_groups").delete().eq("id", groupId); 
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateGroupTags(groupId: string, tags: any[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("ai_code_review_groups").update({ metadata: { tags: tags } }).eq("id", groupId);
  if (error) return { error: error.message };
  return { success: true };
}

// --- CHAT MANAGEMENT ---

export async function deleteChat(chatId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { error } = await supabase.from("ai_code_review_chats").delete().eq("id", chatId).eq("user_id", user.id); 
  if (error) return { error: error.message };
  return { success: true };
}

export async function renameChat(chatId: string, newTitle: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { error } = await supabase.from("ai_code_review_chats").update({ title: newTitle, updated_at: new Date().toISOString() }).eq("id", chatId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateChatGroup(chatId: string, groupId: string | null) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { error } = await supabase.from("ai_code_review_chats").update({ group_id: groupId, updated_at: new Date().toISOString() }).eq("id", chatId).eq("user_id", user.id); 
  if (error) return { error: error.message };
  return { success: true };
}


// --- GENERATION LOGIC ---

export async function generateAiResponse(
  projectId: string, 
  prompt: string, 
  chatId?: string,
  groupId?: string,
  _ignoredModelKey?: string, 
  isRegeneration: boolean = false,
  // 🚨 New parameter for small repo fallback injection
  injectedContext: string | null = null
) {
  const cookieStore = cookies(); 
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let finalPromptPayload = prompt;
  let userContentToStore = prompt; // What the user originally typed
  let estimatedInputTokens = Math.ceil(prompt.length / 4);

  // 🚨 CONTEXT HANDLING & TOKEN ESTIMATION
  if (injectedContext) {
      // 1. Prepend the injected context to the prompt
      finalPromptPayload = `${injectedContext}\n\nUser Question: ${prompt}`;
      // 2. Re-calculate tokens based on the full payload
      estimatedInputTokens = Math.ceil(finalPromptPayload.length / 4);
      // 3. userContentToStore remains the original prompt
      userContentToStore = prompt; 
  }

  // --- TOKEN CHECK ---
  const MINIMUM_OUTPUT_BUFFER = 50; 
  const requiredTokens = estimatedInputTokens + MINIMUM_OUTPUT_BUFFER; // Use updated estimate

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
  
  // Use DB_MODEL_KEY to check balance (no 'models/' prefix)
  const currentModelBalance = remainingTokens[DB_MODEL_KEY] || 0;

  if (!tokenPack || currentModelBalance < requiredTokens) {
    // 🚨 Critical: Return error message only, client will handle notification
    return { error: `Insufficient tokens for ${DB_MODEL_KEY}. Balance: ${currentModelBalance}` };
  }
  
  // --- CACHE CONFIGURATION ---
  let activeCacheKey = null;
  let cachedContentConfig = {};

  // Skip cache check if we are using direct injection
  if (!injectedContext) {
      activeCacheKey = await getActiveCacheKey(projectId);
      if (activeCacheKey) {
        cachedContentConfig = { cachedContent: activeCacheKey };
        console.log(`Using cached context: ${activeCacheKey}`);
      } else {
        console.log("No active repository cache found. Using only prompt context.");
      }
  } else {
       console.log("Using injected context (Repo too small for cache).");
  }


  try {
    // Use API_MODEL_KEY for Google (with 'models/' prefix)
    const response = await ai.models.generateContent({
      model: API_MODEL_KEY, 
      contents: finalPromptPayload, // 🚨 Use the potentially augmented payload
      config: {
        systemInstruction: "You are a **Senior Software Architect and Security Analyst** specializing in detailed code analysis. Your review must cover five key areas: 1. **Security:** Identify and flag common vulnerabilities (e.g., XSS, SQLi, insecure deserialization) with remediation steps. 2. **Performance & Scalability:** Critique data structures, API design, and potential bottlenecks. 3. **Correctness & Logic:** Verify business logic against common patterns and potential edge cases. 4. **Readability & Maintainability:** Assess code structure, naming conventions, and documentation quality. 5. **Architecture:** Evaluate alignment with established design patterns and system goals. Present findings clearly, categorize issues by severity (Critical, Major, Minor), and provide the corrected code snippet immediately following the explanation. **Always refer back to the repository context** when suggesting changes.",
        ...cachedContentConfig
      }
    });

    const text = response.text || "No response generated";
    const outputTokens = Math.ceil(text.length / 4);
    const totalTokensUsed = estimatedInputTokens + outputTokens; // Use updated estimate

    let activeChatId = chatId;

    if (!activeChatId) {
        // Use the original user question for the title, regardless of injection
        const title = userContentToStore.length > 30 ? userContentToStore.substring(0, 30) + "..." : userContentToStore;
        
        const { data: newChat, error: chatError } = await supabase
            .from("ai_code_review_chats") 
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

    // --- DATABASE INSERT ---
    const messagesToInsert: any[] = [];
    
    if (!isRegeneration) {
        messagesToInsert.push({ 
            chat_id: activeChatId, 
            role: 'user', 
            content: userContentToStore, // 🚨 Use the clean user prompt
            tokens_used: estimatedInputTokens, // Use tokens from the full payload
            ai_model: null 
        });
    }
    
    messagesToInsert.push({ 
        chat_id: activeChatId, 
            role: 'ai', 
            content: text, 
            tokens_used: outputTokens, 
            ai_model: DB_MODEL_KEY 
    });

    const { error: insertError } = await supabase.from("ai_code_review_messages").insert(messagesToInsert); 

    if (insertError) {
        console.warn("Insert failed with ai_model column. Retrying without it...", insertError.message);
        const legacyMessages = messagesToInsert.map(({ ai_model, ...rest }) => rest);
        const { error: legacyError } = await supabase.from("ai_code_review_messages").insert(legacyMessages); 
        if (legacyError) throw new Error("Failed to save message: " + legacyError.message);
    }

    const { data: currentChat } = await supabase.from("ai_code_review_chats").select("total_tokens_used").eq("id", activeChatId).single(); 
    const newChatTotal = (currentChat?.total_tokens_used || 0) + totalTokensUsed;

    await supabase.from("ai_code_review_chats").update({ total_tokens_used: newChatTotal, updated_at: new Date().toISOString() }).eq("id", activeChatId); 

    // Update balance using DB_MODEL_KEY
    const newRemaining = {
        ...remainingTokens,
        [DB_MODEL_KEY]: Math.max(0, currentModelBalance - totalTokensUsed)
    };

    await supabase.from("token_packs").update({ remaining_tokens: newRemaining }).eq("id", tokenPack.id);

    await supabase.from("token_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      token_pack_id: tokenPack.id,
      model: DB_MODEL_KEY, 
      tokens_used: totalTokensUsed,
      action: isRegeneration ? "chat_regeneration" : "code_review",
    });

    return { 
        success: true, 
        chatId: activeChatId, 
        message: text, 
        tokensUsed: totalTokensUsed,
        newBalance: newRemaining,
        ai_model: DB_MODEL_KEY
    };

  } catch (error: any) {
    // 🚨 Critical: Return error message only, client will handle notification
    console.error("AI Generation Error:", error);
    return { error: `AI Generation Failed: ${error.message}` };
  }
}