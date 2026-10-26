import type { ReactNode } from "react";
import RoleLogout from "../RoleLogout";

export default function RoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex justify-end bg-[#071327] px-5 py-3 sm:px-10">
        <RoleLogout />
      </div>
      {children}
    </>
  );
}