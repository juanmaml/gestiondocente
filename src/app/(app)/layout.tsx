import { requireUser } from "@/lib/session";
import { getActiveYear, listYears } from "@/lib/year";
import { Sidebar } from "./Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [activeYear, years] = await Promise.all([
    getActiveYear(user.id),
    listYears(user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        userName={user.name ?? user.email ?? "Docente"}
        years={years.map((y) => ({
          id: y.id,
          name: y.name,
          isActive: y.isActive,
        }))}
        activeYearId={activeYear.id}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
