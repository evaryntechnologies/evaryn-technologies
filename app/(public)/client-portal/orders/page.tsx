import Link from "next/link";
import {prisma} from "@/lib/db/prisma";
import {ensureClientProfile} from "../../clients/actions";
import OrderProgress from "@/components/client/OrderProgress";
export default async function ClientOrders(){
 const client=await ensureClientProfile();
 const orders=await prisma.clientOrderAssignment.findMany({where:{clientId:client.id},include:{task:{select:{id:true,title:true,publicTaskId:true}},updates:{orderBy:{createdAt:"desc"},take:1},client:{select:{id:true}}},orderBy:{createdAt:"desc"},take:100});
 return <main className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-widest text-[var(--ev-accent-text)]">Production updates</p><h1 className="mt-2 text-3xl font-bold">Track your orders</h1><p className="mt-2 text-sm text-[var(--ev-muted)]">Client ID: EV-{client.id} · Your QA, Admin or Super Admin team posts progress updates here.</p></header>
 {orders.map(a=>{const latest=a.updates[0];return <article className="space-y-3" key={a.id}><div className="ev-client-panel p-5"><h2 className="font-semibold">{a.task.title}</h2><p className="text-xs text-[var(--ev-muted)]">Order {a.task.publicTaskId??a.task.id}</p><OrderProgress status={latest?.stage??"QUEUED"} delivered={latest?.stage==="DELIVERED"}/><p className="mt-3 text-sm text-[var(--ev-muted)]">{latest?.message??"Your order has been assigned to your account. The team will publish the next update."}</p><p className="mt-2 text-xs text-[var(--ev-muted)]">{latest?.createdAt.toLocaleString("en-GB")??a.createdAt.toLocaleString("en-GB")}</p>{latest?.stage==="DELIVERED"&&<Link href="/client-portal/delivered" className="mt-2 inline-block font-semibold text-[var(--ev-accent-text)] underline">View delivered orders</Link>}</div></article>})}
 {!orders.length&&<section className="ev-client-panel p-8 text-sm text-[var(--ev-muted)]">No orders have been assigned to this client account yet.</section>}
 </main>;
}
