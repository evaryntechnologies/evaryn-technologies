import DashboardPage from "../DashboardPage";

export default function Page() {
  return <DashboardPage variant="qa" roles={["QA", "ADMIN", "SUPER_ADMIN"]} />;
}
