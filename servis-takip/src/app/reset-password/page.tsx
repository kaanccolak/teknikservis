"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const finishCheck = () => {
      setCheckingSession(false);
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        finishCheck();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionReady(true);
        finishCheck();
      }
    });

    const t = window.setTimeout(finishCheck, 2000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Şifre güncellenemedi: " + error.message);
      } else {
        toast.success("Şifreniz güncellendi!");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-[400px] rounded-xl border border-neutral-200 bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Servis Takip
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Yeni şifre belirleyin
          </p>
        </div>

        {!checkingSession && !sessionReady ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-neutral-600">
              Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen
              yeni bir sıfırlama talebinde bulunun.
            </p>
            <Button
              type="button"
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Giriş sayfasına dön
            </Button>
          </div>
        ) : checkingSession ? (
          <p className="mt-8 text-center text-sm text-neutral-500">
            Oturum doğrulanıyor…
          </p>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password-new">Yeni Şifre</Label>
              <Input
                id="reset-password-new"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-neutral-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm">Şifre Tekrar</Label>
              <Input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
                className="border-neutral-300"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {loading ? "Güncelleniyor…" : "Şifreyi Güncelle"}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 font-medium text-[#534AB7] hover:underline"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}
