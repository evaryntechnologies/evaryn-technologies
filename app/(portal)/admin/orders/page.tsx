import { redirect } from "next/navigation";

// The shared register enforces the appropriate employee role authorization.
export default function Page() {
  redirect("/portal/order-register");
}
