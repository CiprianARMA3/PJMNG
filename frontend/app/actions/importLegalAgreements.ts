"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export type LegalDocument = {
  id: number;
  created_at: string;
  document: string;
  active: boolean;
  data: { url: string; [key: string]: any };
  region: string;
};

export type AgreementStatus = LegalDocument & {
  isSigned: boolean;
  signedDate: string | null;
};

export async function getLegalAgreements() {
  const supabase = createClient(cookies());
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // 1. Fetch all active legal documents
  const { data: documents, error: docError } = await supabase
    .from("legal_documents")
    .select("*")
    .eq("active", true)
    .order("id", { ascending: true });

  if (docError) {
    console.error("Error fetching documents:", docError);
    return [];
  }

  // 2. Fetch signatures for the current user
  // We now explicitly select the 'signed' boolean column
  const { data: signatures, error: sigError } = await supabase
    .from("legal_signatures")
    .select("document_id, signed, signed_at")
    .eq("user_id", user.id);

  if (sigError) {
    console.error("Error fetching signatures:", sigError);
    return [];
  }

  // 3. Merge to create status
  const agreements: AgreementStatus[] = documents.map((doc) => {
    const signature = signatures?.find((s) => s.document_id === doc.id);
    
    // NEW LOGIC: A document is only signed if the row exists AND signed is true
    const isSigned = signature ? signature.signed === true : false;

    return {
      ...doc,
      isSigned: isSigned,
      signedDate: isSigned ? signature!.signed_at : null,
    };
  });

  return agreements;
}

export async function signLegalAgreement(documentId: number) {
  const supabase = createClient(cookies());
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // NEW LOGIC: Use upsert to update the existing row created by the trigger
  const { error } = await supabase
    .from("legal_signatures")
    .upsert({
      user_id: user.id,
      document_id: documentId,
      signed: true,  // Mark as true
      signed_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id, document_id' // Identify row by user+doc combination
    });

  if (error) {
    console.error("Signing error:", error);
    throw new Error("Failed to sign agreement");
  }

  revalidatePath("/dashboard");
  return { success: true };
}