export type WorkTab = "all"|"progress"|"revision"|"completed"|"cancelled";
export function cleanTab(value:unknown):WorkTab {return value==="progress"||value==="revision"||value==="completed"||value==="cancelled"?value:"all";}
export function statusTab(status:string):Exclude<WorkTab,"all"> {
 const s=status.toUpperCase();
 if(s==="COMPLETED")return "completed";
 if(s==="CANCELLED"||s==="CANCELED")return "cancelled";
 if(s==="REWORK_REQUIRED"||s==="REVISION_REQUIRED"||s==="IN_REVISION")return "revision";
 return "progress";
}
export const workTabNames:Record<WorkTab,string>={all:"All My Orders",progress:"In Progress",revision:"In Revision",completed:"Completed Orders",cancelled:"Canceled Orders"};
