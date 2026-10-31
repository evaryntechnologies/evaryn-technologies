import DashboardPage from "../DashboardPage";

export default function Page() {
  return <DashboardPage variant="admin" roles={["ADMIN", "SUPER_ADMIN"]} />;
}
