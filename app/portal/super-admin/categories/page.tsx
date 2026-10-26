import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { manageCategory } from "./actions";

const input = "min-w-0 w-full rounded-lg border border-white/20 bg-[#071327] px-3 py-2 text-white";
async function Content({searchParams}:{searchParams:Promise<{message?:string;ok?:string}>}) {
  await connection();
  const user = await requireEmployee(["SUPER_ADMIN"]);
  const profile = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{role:true,status:true}});
  if (!profile || profile.role!=="SUPER_ADMIN" || profile.status!=="ACTIVE") return <main className="p-8">Access denied.</main>;
  const [categories,params] = await Promise.all([prisma.taskCategory.findMany({orderBy:{name:"asc"}}),searchParams]);
  async function submit(data:FormData) {"use server";const result = await manageCategory(data);redirect("/portal/super-admin/categories?ok="+(result.ok?"1":"0")+"&message="+encodeURIComponent(result.message));}
  return <main className="min-h-screen w-full bg-[#071327] px-4 py-8 text-white sm:px-8 lg:px-12">
    <div className="w-full">
      <Link href="/portal/super-admin" className="text-cyan-300 hover:underline">Back to Super Admin</Link>
      <h1 className="mt-5 text-3xl font-bold">Task Categories</h1>
      <p className="mt-2 text-slate-300">Manage the categories available when creating tasks. Existing tasks remain protected.</p>
      {params.message && <p role="status" className="mt-5 rounded-xl border border-white/20 p-4">{params.ok==="1"?"Success: ":"Error: "}{params.message}</p>}
      <section className="mt-7 rounded-2xl border border-white/10 bg-[#101F39] p-5 sm:p-7">
        <h2 className="font-semibold text-xl">Create Category</h2>
        <form action={submit} className="mt-4 flex flex-wrap gap-3"><input name="operation" value="create" type="hidden"/><input name="name" required minLength={2} maxLength={80} placeholder="Category name" aria-label="New category name" className={input+" flex-1"}/><button className="rounded-lg bg-[#0052CC] px-5 py-2 font-semibold">Add Category</button></form>
      </section>
      <section className="mt-7 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3" aria-label="Existing categories">
        {categories.map(category=><article key={category.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#101F39] p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{category.name}</h2><span className={category.active?"text-emerald-300":"text-amber-300"}>{category.active?"Active":"Inactive"}</span></div>
          <form action={submit} className="flex flex-wrap gap-2"><input type="hidden" name="operation" value="rename"/><input type="hidden" name="id" value={category.id}/><input name="name" aria-label={`Rename ${category.name}`} defaultValue={category.name} required minLength={2} maxLength={80} className={input+" flex-1"}/><button className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Save Name</button></form>
          <div className="mt-3 flex flex-wrap gap-2"><form action={submit}><input type="hidden" name="operation" value="toggle"/><input type="hidden" name="id" value={category.id}/><button className="rounded-lg border border-cyan-400/40 px-3 py-2 text-cyan-200">{category.active?"Deactivate":"Activate"}</button></form><form action={submit}><input type="hidden" name="operation" value="delete"/><input type="hidden" name="id" value={category.id}/><button className="rounded-lg border border-red-400/40 px-3 py-2 text-red-200">Delete if unused</button></form></div>
        </article>)}
        {!categories.length && <p className="text-slate-300">No categories yet. Add your first category above.</p>}
      </section>
    </div>
  </main>;
}
export default function Page({searchParams}:{searchParams:Promise<{message?:string;ok?:string}>}) {return <Suspense fallback={<main className="min-h-screen bg-[#071327] p-8 text-white">Loading categories...</main>}><Content searchParams={searchParams}/></Suspense>}
