import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {prisma} from "@/lib/db/prisma";
import {submitExpertApplication} from "../actions";
export default async function ExpertApplication({searchParams}:{searchParams:Promise<{error?:string;submitted?:string}>}){
 const p=await searchParams;
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/experts/login");if(!user.email_confirmed_at)redirect("/experts/verify-email");
 const employee=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{status:true}});
 const app=await prisma.expertApplication.findUnique({where:{authUserId:user.id}});
 if(employee?.status==="ACTIVE")return <main className="mx-auto max-w-2xl px-6 py-16"><h1 className="text-3xl font-bold">Welcome to Evaryn</h1><p className="mt-3">Your expert account has been approved.</p><Link className="mt-5 inline-block rounded bg-blue-700 px-5 py-3 text-white" href="/portal">Open Employee Portal</Link></main>;
 if(app)return <main className="mx-auto max-w-2xl px-6 py-16"><h1 className="text-3xl font-bold">Application Status</h1><div className="mt-6 rounded-xl border p-6"><p><strong>Name:</strong> {app.fullName}</p><p className="mt-2"><strong>Status:</strong> {app.status.replaceAll("_"," ")}</p><p className="mt-2">Submitted: {app.createdAt.toLocaleDateString("en-GB")}</p><p className="mt-4">{app.status==="REJECTED"?"Your application was not approved.":"Your application remains restricted until approved by Evaryn's management team."}</p></div></main>;
 if(user.app_metadata?.role||employee)redirect("/portal");
 return <main className="mx-auto max-w-2xl px-6 py-16"><h1 className="text-3xl font-bold">Complete Your Expert Application</h1><p className="mt-3">Tell us about your professional experience. Submitting this form does not grant employee access.</p>{p.error&&<p role="alert" className="mt-3 text-red-500">Please provide valid professional details.</p>}{p.submitted&&<p className="mt-3 text-emerald-600">Application received.</p>}<form action={submitExpertApplication} className="mt-8 grid gap-4"><label>Country<input required name="country" maxLength={100} className="mt-1 w-full rounded border p-3 text-slate-950"/></label><label>Skills (comma-separated)<input required name="expertise" placeholder="Data annotation, Python, Editing" className="mt-1 w-full rounded border p-3 text-slate-950"/></label><label>Experience and qualifications<textarea name="experience" required minLength={20} maxLength={3000} rows={6} className="mt-1 w-full rounded border p-3 text-slate-950"/></label><label>Portfolio link (optional)<input name="portfolioUrl" type="url" maxLength={500} className="mt-1 w-full rounded border p-3 text-slate-950"/></label><button className="rounded bg-blue-700 px-6 py-3 font-bold text-white">Submit for Review</button></form></main>;
}
