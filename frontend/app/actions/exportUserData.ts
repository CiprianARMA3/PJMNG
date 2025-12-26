"use server";

import { createClient } from "@/utils/supabase/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cookies } from "next/headers";

export async function exportUserData() {
  const supabase = createClient(cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 1. Check for 30-day restriction in user metadata
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("metadata")
    .eq("id", user.id)
    .single();

  if (profileError) throw new Error("Could not fetch user profile");

  const lastExport = profile.metadata?.last_data_export;
  const now = new Date();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  console.log("Exporting Data");

  if (lastExport && (now.getTime() - new Date(lastExport).getTime() < thirtyDaysInMs)) {
    const nextExportDate = new Date(new Date(lastExport).getTime() + thirtyDaysInMs);
    throw new Error(`You can only export data once every 30 days. Next available: ${nextExportDate.toLocaleDateString()}`);
  }

  // 2. Fetch data from all relevant tables
  const tables = [
    "activity_logs", "ai_chats", "ai_messages", "ai_code_review_chats", 
    "concepts", "issue_comments", "issues", "modifications", 
    "task_comments", "tasks", "token_transactions", "token_usage_logs"
  ];

  const userData: Record<string, any[]> = {};
  
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id);
    userData[table] = data || [];
  }

  // 3. Generate PDF
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("User Data Export", 14, 22);
  doc.setFontSize(10);
  doc.text(`User ID: ${user.id}`, 14, 30);
  doc.text(`Export Date: ${now.toLocaleString()}`, 14, 35);

  let currentY = 45;

  Object.entries(userData).forEach(([tableName, rows]) => {
    if (rows.length > 0) {
      doc.setFontSize(14);
      doc.text(tableName.toUpperCase().replace(/_/g, " "), 14, currentY);
      
      const headers = Object.keys(rows[0]);
      const body = rows.map(row => Object.values(row).map(v => 
        typeof v === "object" ? JSON.stringify(v).substring(0, 30) + "..." : String(v)
      ));

      autoTable(doc, {
        startY: currentY + 5,
        head: [headers],
        body: body,
        theme: 'striped',
        styles: { fontSize: 7 },
        margin: { top: 10 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    }
  });

  // 4. Update metadata to record the export time
  const updatedMetadata = { 
    ...(profile.metadata || {}), 
    last_data_export: now.toISOString() 
  };
  
  await supabase
    .from("users")
    .update({ metadata: updatedMetadata })
    .eq("id", user.id);

  // Return base64 PDF
  return doc.output("datauristring");
}