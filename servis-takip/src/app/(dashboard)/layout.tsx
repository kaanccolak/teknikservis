"use client";

import { useState } from "react";

import AiAssistant from "@/components/AiAssistant";
import DemoBanner from "@/components/demo-banner";
import OneriModal from "@/components/OneriModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [oneriOpen, setOneriOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50/80">
      <Sidebar onOneriOpen={() => setOneriOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <DemoBanner />
        <main className="flex-1 overflow-auto p-6 pt-20 lg:pt-6">{children}</main>
      </div>
      <AiAssistant />
      <OneriModal open={oneriOpen} onClose={() => setOneriOpen(false)} />
    </div>
  );
}
