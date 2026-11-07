import { connection } from "next/server";
import { Inbox } from "lucide-react";
import { requireEmployee } from "@/lib/auth/require-employee";
import { loadClientThreads, ClientThreadList } from "./list";
import { PageFrame, PageTitle, SplitPlaceholder, SplitView } from "@/app/(portal)/layouts";

export default async function ClientMessages({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await connection();
  await requireEmployee(["QA", "ADMIN", "SUPER_ADMIN"]);
  const q = String((await searchParams).q ?? "").trim().slice(0, 100);
  const rows = await loadClientThreads(q);
  return (
    <PageFrame>
      <PageTitle eyebrow="Client management" title="Client messages" description="Shared inbox for QA, Admin and Super Admin. Every conversation belongs to one order." />
      <SplitView label="Client messages" hasDetail={false}
        list={<ClientThreadList rows={rows} q={q} />}
        detail={<SplitPlaceholder icon={Inbox} title="Select a conversation" text="Choose an order on the left to read the thread, see its files and reply to the client." />} />
    </PageFrame>
  );
}
