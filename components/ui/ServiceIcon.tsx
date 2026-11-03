import { Camera, Clapperboard, Database, FileText, PenLine, ScanLine, type LucideIcon } from "lucide-react";
import type { ServiceIcon as ServiceIconName } from "@/lib/services";

const map: Record<ServiceIconName, LucideIcon> = {
  file: FileText,
  pen: PenLine,
  database: Database,
  video: Clapperboard,
  scan: ScanLine,
  camera: Camera,
};

export default function ServiceIcon({ name, size = 24 }: { name: ServiceIconName; size?: number }) {
  const Icon = map[name] ?? FileText;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
