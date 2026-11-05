import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { removePrivateFile, uploadPrivateFile } from "@/lib/private-order-files";

const types=["application/pdf","text/plain","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/png","image/jpeg"];
const prefixes:Record<string,string>={"Video Editing":"VID","Technical Writing":"TWR","Website Development":"WBD","Non-Technical Writing":"NTW","AI Data Annotation":"ADA","AI Training Data Operations":"ATO","Other":"OTH"};
export function categoryPrefix(category:string) {const result=prefixes[category];if(!result)throw new Error("Unsupported order category");return result;}
export type MessageRow={id:string;requestId:string;senderKind:string;body:string;createdAt:Date;senderId:string};
export type AttachmentRow={id:string;requestId:string;messageId:string|null;purpose:string;fileName:string;storageKey:string;contentType:string;createdAt:Date};
export async function listClientMessages(requestId:string) {return prisma.$queryRaw<MessageRow[]>(Prisma.sql`
 SELECT "id","requestId","senderKind","senderId","body","createdAt" FROM public."ClientOrderMessage"
 WHERE "requestId"=${requestId}::uuid ORDER BY "createdAt" ASC LIMIT 500`);}
export async function listClientAttachments(requestId:string) {return prisma.$queryRaw<AttachmentRow[]>(Prisma.sql`
 SELECT "id","requestId","messageId","purpose","fileName","storageKey","contentType","createdAt" FROM public."ClientOrderAttachment"
 WHERE "requestId"=${requestId}::uuid ORDER BY "createdAt" ASC LIMIT 100`);}
export async function listRequestTaskLinks(clientId:string) {return prisma.$queryRaw<{taskId:string;requestId:string}[]>(Prisma.sql`
 SELECT l."taskId",l."requestId" FROM public."ClientOrderLink" l
 WHERE l."clientId"=${clientId}::uuid AND l."requestId" IS NOT NULL`);}
export async function listAvailableClientRequests() {return prisma.$queryRaw<{id:string;clientOrderCode:string;title:string;service:string}[]>(Prisma.sql`
 SELECT r."id",r."clientOrderCode",r."title",r."service" FROM public."ClientProjectRequest" r
 LEFT JOIN public."ClientOrderLink" l ON l."requestId"=r."id"
 WHERE l."id" IS NULL AND r."clientOrderCode" IS NOT NULL AND r."status" NOT IN ('CLOSED','REJECTED')
 ORDER BY r."createdAt" DESC LIMIT 400`);}
export async function uploadClientRequestAttachments(requestId:string,files:File[]) {
 if(files.length>5)throw new Error("Too many attachments");
 for(const f of files){
  const uploaded=await uploadPrivateFile(f,`client-orders/${requestId}`,types);
  try {await prisma.$executeRaw(Prisma.sql`
   INSERT INTO public."ClientOrderAttachment" ("requestId","fileName","storageKey","contentType","fileSize")
   VALUES (${requestId}::uuid,${uploaded.fileName},${uploaded.storageKey},${uploaded.contentType},${uploaded.fileSize})`);
  } catch(e){await removePrivateFile(uploaded.storageKey);throw e;}
 }
}
export async function notifyClientTeam(requestId:string,title:string,body:string){
 const staff=await prisma.employeeProfile.findMany({where:{role:{in:["QA","ADMIN","SUPER_ADMIN"]},status:"ACTIVE"},select:{id:true}});
 if(staff.length)await prisma.portalNotification.createMany({data:staff.map(s=>({recipientId:s.id,title,body,href:`/portal/client-messages/${requestId}`}))});
}
