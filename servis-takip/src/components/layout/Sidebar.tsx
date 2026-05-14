"use client";

import {
  BarChart,
  Building2,
  Calendar,
  Landmark,
  LogOut,
  Package,
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
import OneriModal from "@/components/OneriModal";
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
  { href: "/raporlar", label: "Raporlar", icon: BarChart },
  { href: "/sirketim", label: "Şirketim", icon: Landmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
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
      .then((data: { name?: string }) => {
        applyShop(data);
      })
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
    setMobileOpen(false);
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/landing");
    setLoggingOut(false);
  }

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-14 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-md lg:hidden"
        style={{ zIndex: 99999 }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menü"
      >
        {mobileOpen ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300",
          "lg:static lg:z-auto lg:h-auto lg:translate-x-0 lg:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="border-b border-slate-100 px-5 py-6">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "28px",
                height: "28px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "#4f46e5",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "4px",
                    borderRadius: "1px",
                    background: "white",
                  }}
                />
                <div
                  style={{
                    width: "7px",
                    height: "10px",
                    borderRadius: "1px",
                    background: "white",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "-3px",
                  right: "-3px",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                  <path
                    d="M1 3.5L2.8 5.5L6 1.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              tamir
              <span style={{ fontWeight: 300, color: "#4f46e5" }}>takip</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {shopName || "TamirTakip"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
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
                prefetch={false}
                onClick={(e) => {
                  setMobileOpen(false);
                  handleNavClick(e, item.href);
                }}
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
                <span className="min-w-0 flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200/80 p-3">
          <OneriModal />
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

      <AlertDialog
        open={pendingHref !== null}
        onOpenChange={(open) => !open && setPendingHref(null)}
      >
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
