import {clientOrderStage,stageNames} from "@/lib/client/order-stage";
export default function OrderProgress({status,delivered=false}:{status:string;delivered?:boolean}){
 const s=clientOrderStage(status);
 return <div className="ev-client-panel space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{delivered?"Delivered to your workspace":s.label}</strong><span className="text-xs text-[var(--ev-muted)]">{delivered?"Ready for feedback":s.note}</span></div><ol aria-label="Order progress" className="grid grid-cols-5 gap-1.5">{stageNames.map((name,i)=><li key={name} className="min-w-0"><div aria-current={i===s.step?"step":undefined} className={`h-2 rounded-full ${i<=s.step?"bg-[var(--ev-primary)]":"bg-[var(--ev-border)]"}`}/><span className="mt-1.5 block truncate text-[10px] font-semibold sm:text-xs">{name}</span></li>)}</ol></div>;
}
