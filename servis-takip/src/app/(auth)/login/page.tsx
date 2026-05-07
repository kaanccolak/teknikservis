"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type TabMode = "login" | "register";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [mode, setMode] = useState<TabMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [shopName, setShopName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordRepeat, setRegisterPasswordRepeat] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setEmail("demo@demo.tr");
      setPassword("demodemo");
    }
  }, [isDemo]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.refresh();
    router.push("/");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const nameTrim = shopName.trim();
    if (nameTrim.length < 2) {
      toast.error("Şirket / dükkan adı en az 2 karakter olmalıdır.");
      return;
    }
    if (registerPassword !== registerPasswordRepeat) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setRegisterLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: registerEmail.trim(),
      password: registerPassword,
    });

    if (error) {
      setRegisterLoading(false);
      toast.error(error.message);
      return;
    }

    if (!data.user) {
      setRegisterLoading(false);
      toast.error("Kayıt tamamlanamadı.");
      return;
    }

    if (!data.session) {
      setRegisterLoading(false);
      toast.message(
        "Kayıt alındı. E-postanızdaki onay bağlantısına tıklayın; ardından giriş yaparak devam edin.",
      );
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.user.id,
        shopName: nameTrim,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setRegisterLoading(false);
      toast.error(body.error ?? "Şirket kaydı oluşturulamadı.");
      return;
    }

    toast.success("Kayıt başarılı! Giriş yapılıyor...");
    router.refresh();
    router.push("/");
    setRegisterLoading(false);
  }

  async function handleForgotPassword() {
    const emailTrim = resetEmail.trim();
    if (!emailTrim) {
      toast.error("E-posta adresinizi girin");
      return;
    }
    setResetLoading(true);
    try {
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim }),
      });
      const checkData = (await checkRes.json()) as { exists?: boolean };

      if (!checkRes.ok) {
        toast.error("E-posta kontrolü yapılamadı");
        return;
      }

      if (!checkData.exists) {
        toast.error("Bu e-posta adresi sistemimizde kayıtlı değil");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error("Hata: " + error.message);
      } else {
        setResetSent(true);
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setResetLoading(false);
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
            Teknik Servis Yönetim Sistemi
          </p>
        </div>

        {showForgotPassword ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setResetEmail("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "16px",
                padding: "0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ← Geri dön
            </button>

            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Şifre Sıfırla
            </h2>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
              E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
            </p>

            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            />

            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              disabled={resetLoading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#534AB7",
                color: "white",
                border: "none",
                borderRadius: "9px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: resetLoading ? "wait" : "pointer",
                opacity: resetLoading ? 0.85 : 1,
              }}
            >
              {resetLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>

            {resetSent ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#16a34a",
                }}
              >
                ✓ Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mt-8 flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                  mode === "login"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                  mode === "register"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                Kayıt Ol
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {isDemo ? (
              <div
                style={{
                  background: "#F0EFFE",
                  border: "1px solid #C5BEFF",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#534AB7",
                }}
              >
                Demo hesabı otomatik dolduruldu. Giriş yaparak uygulamayı
                keşfedin.
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="login-email">E-posta</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-neutral-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Şifre</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-neutral-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: "none",
                border: "none",
                color: "#534AB7",
                fontSize: "13px",
                cursor: "pointer",
                padding: "0",
                marginTop: "8px",
              }}
            >
              Şifremi unuttum
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Şirket / Dükkan Adı</Label>
              <Input
                id="shop-name"
                type="text"
                autoComplete="organization"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                disabled={registerLoading}
                className="border-neutral-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">E-posta</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
                disabled={registerLoading}
                className="border-neutral-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Şifre</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showRegisterPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="border-neutral-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label={
                    showRegisterPassword ? "Şifreyi gizle" : "Şifreyi göster"
                  }
                >
                  {showRegisterPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password-repeat">Şifre tekrar</Label>
              <Input
                id="register-password-repeat"
                type={showRegisterPassword ? "text" : "password"}
                autoComplete="new-password"
                value={registerPasswordRepeat}
                onChange={(e) => setRegisterPasswordRepeat(e.target.value)}
                required
                disabled={registerLoading}
                className="border-neutral-300"
              />
            </div>
            <Button
              type="submit"
              disabled={registerLoading}
              className="h-11 w-full bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {registerLoading ? "Kaydediliyor…" : "Kayıt Ol"}
            </Button>
          </form>
        )}
          </>
        )}

        <p className="mt-8 text-center text-sm">
          <Link
            href="/landing"
            className="inline-flex items-center justify-center gap-1.5 font-medium text-[#534AB7] hover:underline"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Anasayfaya Dön
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
          <span className="text-sm text-neutral-500">Yükleniyor…</span>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
