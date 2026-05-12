import DemoBanner from "@/components/demo-banner";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50/80">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <DemoBanner />
        <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
