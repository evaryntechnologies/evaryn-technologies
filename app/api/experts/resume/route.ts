import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
const MAX_SIZE = 3 * 1024 * 1024;
const BUCKET = "task-attachments";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at || user.app_metadata?.role) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const [employee, existing] = await Promise.all([
    prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
    prisma.expertApplication.findUnique({ where: { authUserId: user.id }, select: { id: true } }),
  ]);
  if (employee || existing) return NextResponse.json({ error: "Application is already submitted or unavailable." }, { status: 409 });

  const type = request.headers.get("content-type") || "";
  if (!type.includes("multipart/form-data")) return NextResponse.json({ error: "Invalid upload format." }, { status: 415 });
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Choose a résumé up to 3 MB." }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  const extension = name.endsWith(".pdf") ? "pdf" : name.endsWith(".docx") ? "docx" : null;
  const allowedType = extension === "pdf" ? ["application/pdf", "application/octet-stream"] : ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"];
  if (!extension || !allowedType.includes(file.type)) return NextResponse.json({ error: "Use PDF or DOCX." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === "pdf" && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    return NextResponse.json({ error: "Invalid PDF file." }, { status: 400 });
  }
  if (extension === "docx" && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    return NextResponse.json({ error: "Invalid DOCX file." }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Private upload storage is not configured." }, { status: 503 });
  const storage = createAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(BUCKET);
  const path = `expert-resumes/${user.id}/${randomUUID()}.${extension}`;
  const uploaded = await storage.upload(path, bytes, { contentType: extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", upsert: false });
  if (uploaded.error) return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  return NextResponse.json({ key: path }, { headers: { "Cache-Control": "no-store" } });
}
