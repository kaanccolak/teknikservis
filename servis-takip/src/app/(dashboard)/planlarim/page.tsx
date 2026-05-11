"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PAYMENT_CATEGORIES,
  type PaymentPlanRow,
  calendarDaysUntilDue,
  formatPlanDate,
  getCategoryColor,
  getCategoryLabel,
  getDaysColor,
} from "@/lib/payment-plan-helpers";

type FilterTab = "all" | "pending" | "completed";

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function PlanListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] rounded-lg border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function PlanlarimPage() {
  const [plans, setPlans] = useState<PaymentPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentPlanRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("diger");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState("1");
  const [notes, setNotes] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<PaymentPlanRow | null>(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [deletingWithPassword, setDeletingWithPassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-plans");
      const data = (await res.json()) as {
        plans?: PaymentPlanRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Planlar yüklenemedi");
        setPlans([]);
        return;
      }
      setPlans(data.plans ?? []);
    } catch {
      setError("Bağlantı hatası");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const filtered = useMemo(() => {
    if (filter === "pending") return plans.filter((p) => !p.isCompleted);
    if (filter === "completed") return plans.filter((p) => p.isCompleted);
    return plans;
  }, [plans, filter]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setCategory("diger");
    setAmount("");
    setDueDate(toDateInputValue(new Date().toISOString()));
    setIsRecurring(false);
    setRecurringDay("1");
    setNotes("");
    setDialogOpen(true);
  }

  function openEdit(plan: PaymentPlanRow) {
    setEditing(plan);
    setTitle(plan.title);
    setCategory(plan.category ?? "diger");
    setAmount(
      plan.amount != null && !Number.isNaN(plan.amount)
        ? String(plan.amount)
        : "",
    );
    setDueDate(toDateInputValue(plan.dueDate));
    setIsRecurring(plan.isRecurring);
    setRecurringDay(
      plan.recurringDay != null ? String(plan.recurringDay) : "1",
    );
    setNotes(plan.notes ?? "");
    setDialogOpen(true);
  }

  async function savePlan() {
    if (!title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    if (!dueDate.trim()) {
      toast.error("Tarih zorunludur");
      return;
    }
    if (isRecurring) {
      const d = parseInt(recurringDay, 10);
      if (!Number.isFinite(d) || d < 1 || d > 31) {
        toast.error("Ayın günü 1–31 olmalıdır");
        return;
      }
    }

    const body = {
      title: title.trim(),
      category: category || null,
      amount: amount.trim() === "" ? null : Number(amount.replace(",", ".")),
      dueDate: new Date(dueDate + "T12:00:00").toISOString(),
      isRecurring,
      recurringDay: isRecurring ? parseInt(recurringDay, 10) : null,
      notes: notes.trim() || null,
    };

    if (body.amount != null && Number.isNaN(body.amount)) {
      toast.error("Geçersiz tutar");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/payment-plans/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            recurringDay: isRecurring ? body.recurringDay : null,
            isRecurring,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Güncellenemedi");
          return;
        }
        toast.success("Plan güncellendi");
      } else {
        const res = await fetch("/api/payment-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Oluşturulamadı");
          return;
        }
        toast.success("Plan eklendi");
      }
      setDialogOpen(false);
      await loadPlans();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleUncomplete(id: string) {
    try {
      const res = await fetch(`/api/payment-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: false, completedAt: null }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Güncellenemedi");
        return;
      }
      toast.success("Plan tekrar bekleyen olarak işaretlendi");
      await loadPlans();
    } catch {
      toast.error("Bağlantı hatası");
    }
  }

  async function toggleComplete(plan: PaymentPlanRow) {
    const next = !plan.isCompleted;
    const prevSnapshot = plan;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id
          ? {
              ...p,
              isCompleted: next,
              completedAt: next ? new Date().toISOString() : null,
            }
          : p,
      ),
    );
    try {
      const res = await fetch(`/api/payment-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: next }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "İşlem başarısız");
      }
      const updated = (await res.json()) as PaymentPlanRow;
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum güncellenemedi");
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? prevSnapshot : p)),
      );
    }
  }

  async function confirmDeleteWithPassword() {
    if (!deletePassword.trim()) {
      setDeletePasswordError("Parola girin");
      return;
    }
    if (!pendingDeleteId) return;
    setDeletingWithPassword(true);
    setDeletePasswordError("");
    try {
      const res = await fetch(`/api/payment-plans/${pendingDeleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsPassword: deletePassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 403) {
          setDeletePasswordError(data.error ?? "Parola yanlış");
          return;
        }
        toast.error(data.error ?? "Silinemedi");
        return;
      }
      setShowDeletePasswordModal(false);
      setDeletePassword("");
      setPendingDeleteId(null);
      setDeleteTarget(null);
      toast.success("Silindi");
      await loadPlans();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setDeletingWithPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Planlarım</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ödeme ve görev hatırlatıcıları
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 size-4" aria-hidden />
          Yeni Plan Ekle
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tümü"],
            ["pending", "Bekleyen"],
            ["completed", "Tamamlanan"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <PlanListSkeleton />
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-600">
          {filter === "pending"
            ? "Bekleyen plan yok"
            : filter === "completed"
              ? "Tamamlanan plan yok"
              : "Henüz plan eklenmedi"}
        </p>
      ) : (
        <div>
          {filtered.map((plan) => {
            const daysLeft = calendarDaysUntilDue(plan.dueDate);
            const cat = getCategoryColor(plan.category);
            return (
              <div
                key={plan.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  background: plan.isCompleted ? "#f9fafb" : "white",
                  opacity: plan.isCompleted ? 0.7 : 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => void toggleComplete(plan)}
                  aria-label={
                    plan.isCompleted
                      ? "Tamamlanmadı olarak işaretle"
                      : "Tamamlandı olarak işaretle"
                  }
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: `2px solid ${plan.isCompleted ? "#10b981" : "#d1d5db"}`,
                    background: plan.isCompleted ? "#10b981" : "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {plan.isCompleted ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: "14px",
                      textDecoration: plan.isCompleted
                        ? "line-through"
                        : "none",
                      color: plan.isCompleted ? "#9ca3af" : "#111",
                    }}
                  >
                    {plan.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "2px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <span>{formatPlanDate(plan.dueDate)}</span>
                    {plan.amount != null && !Number.isNaN(plan.amount) ? (
                      <span>
                        ₺
                        {plan.amount.toLocaleString("tr-TR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : null}
                    {plan.category ? (
                      <span
                        style={{
                          background: cat.bg,
                          color: cat.color,
                          padding: "1px 8px",
                          borderRadius: "20px",
                          fontSize: "11px",
                        }}
                      >
                        {getCategoryLabel(plan.category)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {!plan.isCompleted ? (
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: getDaysColor(daysLeft),
                      }}
                    >
                      {daysLeft === 0
                        ? "Bugün!"
                        : daysLeft < 0
                          ? `${Math.abs(daysLeft)} gün geçti`
                          : `${daysLeft} gün kaldı`}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {plan.isCompleted ? (
                    <button
                      type="button"
                      onClick={() => void handleUncomplete(plan.id)}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        background: "white",
                        color: "#6b7280",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Geri Al
                    </button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openEdit(plan)}
                    aria-label="Düzenle"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(plan)}
                    aria-label="Sil"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Planı Düzenle" : "Yeni Plan"}
            </DialogTitle>
            <DialogDescription>
              Hatırlatıcı bilgilerini girin. Tekrarlayan planlar vade geçince
              otomatik ilerletilir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pp-title">
                Başlık <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn. Kira Ödemesi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pp-cat">Kategori</Label>
              <select
                id="pp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {Object.entries(PAYMENT_CATEGORIES).map(([key, v]) => (
                  <option key={key} value={key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pp-amount">Tutar (₺)</Label>
              <Input
                id="pp-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Opsiyonel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pp-due">
                Tarih <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pp-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="pp-rec"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="pp-rec" className="font-normal">
                Tekrarlayan (her ay)
              </Label>
            </div>
            {isRecurring ? (
              <div className="space-y-1.5">
                <Label htmlFor="pp-day">Ayın kaçında? (1–31)</Label>
                <Input
                  id="pp-day"
                  type="number"
                  min={1}
                  max={31}
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="pp-notes">Notlar</Label>
              <Textarea
                id="pp-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsiyonel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button type="button" onClick={() => void savePlan()} disabled={saving}>
              {saving ? "Kaydediliyor…" : editing ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Planı silmek istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">İptal</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                if (!deleteTarget) return;
                setPendingDeleteId(deleteTarget.id);
                setDeleteTarget(null);
                setShowDeletePasswordModal(true);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showDeletePasswordModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "380px",
              margin: "0 16px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              🗑️
            </div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Silme İşlemi
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              Bu işlemi onaylamak için yönetici parolasını girin
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && void confirmDeleteWithPassword()
              }
              placeholder="Yönetici parolası"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: deletePasswordError
                  ? "1px solid #fca5a5"
                  : "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
              autoFocus
            />
            {deletePasswordError ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  marginBottom: "8px",
                }}
              >
                {deletePasswordError}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => void confirmDeleteWithPassword()}
                disabled={deletingWithPassword}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {deletingWithPassword ? "Siliniyor..." : "Sil"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeletePasswordModal(false);
                  setDeletePassword("");
                  setDeletePasswordError("");
                  setPendingDeleteId(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
