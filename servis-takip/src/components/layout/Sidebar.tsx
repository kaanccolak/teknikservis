"use client";

import {
  BarChart,
  Building2,
  Calendar,
  Landmark,
  LogOut,
  Package,
  Settings,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems: {
  href: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { href: "/", label: "Gösterge Paneli" },
  { href: "/cihaz-kayit", label: "Cihaz Kayıt" },
  { href: "/cihaz-sorgula", label: "Cihaz Sorgula" },
  { href: "/ikinci-el", label: "İkinci El Cihazlar" },
  { href: "/bekleyen-cihazlar", label: "Bekleyen Cihazlar" },
  { href: "/dis-servis", label: "Dış Servisler", icon: Truck },
  { href: "/stok", label: "Stok Yönetimi", icon: Package },
  { href: "/cari", label: "Cari Yönetimi", icon: Building2 },
  { href: "/bayiler", label: "Bayiler", icon: Store },
  { href: "/planlarim", label: "Planlarım", icon: Calendar },
  { href: "/tanimlar", label: "Tanımlar", icon: Settings },
  { href: "/raporlar", label: "Raporlar", icon: BarChart },
  { href: "/sirketim", label: "Şirketim", icon: Landmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function applyShop(data: { name?: string }) {
      if (!cancelled && typeof data?.name === "string") {
        setShopName(data.name);
      }
    }
    void fetch("/api/shop")
      .then((r) => r.json())
      .then(applyShop)
      .catch(() => {});
    const onShopUpdated = (e: Event) => {
      const d = (e as CustomEvent<{ name?: string }>).detail;
      if (d?.name) setShopName(d.name);
    };
    window.addEventListener("shop-updated", onShopUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("shop-updated", onShopUpdated);
    };
  }, []);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href === pathname) return;
    if (pathname !== "/cihaz-kayit") return;
    if (!window.__formIsDirty) return;
    e.preventDefault();
    setPendingHref(href);
  }

  async function handleSignOut() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/landing");
    setLoggingOut(false);
  }

  return (
    <>
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 px-5 py-6">
          <p className="logo-sub text-xs font-medium uppercase tracking-wide text-slate-500">
            Teknik Servis Yönetimi
          </p>
          <p className="logo-title mt-1 text-lg font-semibold text-slate-900">
            {shopName || "Servis Takip"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {Icon ? (
                  <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200/80 p-3">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={loggingOut}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors",
              "hover:bg-neutral-50 disabled:opacity-50",
            )}
          >
            <LogOut className="size-4 shrink-0 opacity-70" aria-hidden />
            {loggingOut ? "Çıkılıyor…" : "Çıkış Yap"}
          </button>
        </div>
      </aside>

      <AlertDialog open={pendingHref !== null} onOpenChange={(open) => !open && setPendingHref(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sayfadan ayrılmak istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Doldurduğunuz bilgiler kaydedilmeyecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Sayfada Kal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                const target = pendingHref;
                setPendingHref(null);
                window.__formIsDirty = false;
                if (target) {
                  router.push(target);
                }
              }}
            >
              Evet, Ayrıl
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
