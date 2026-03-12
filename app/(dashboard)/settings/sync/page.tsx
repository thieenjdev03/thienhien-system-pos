'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { backupRepo } from "@/repos/backupRepo";
import { vi } from "@/shared/i18n/vi";
import { cn } from "@/lib/utils";
import type { BackupPayload } from "@/domain/models";

const LS_SYNC_TOKEN = "pos_sync_token";

type Message = { type: "success" | "error"; text: string } | null;

function getCounts(payload: BackupPayload) {
  return {
    users: payload.data.users.length,
    products: payload.data.products.length,
    customers: payload.data.customers.length,
    invoices: payload.data.invoices.length,
    invoiceItems: payload.data.invoiceItems.length,
    counters: payload.data.counters.length,
  };
}

export default function SyncPage() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<"push" | "pull" | null>(null);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    document.title = "Đồng bộ dữ liệu - POS Thiện Hiền";
  }, []);

  useEffect(() => {
    setToken(localStorage.getItem(LS_SYNC_TOKEN) || "");
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_SYNC_TOKEN, token);
  }, [token]);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  }, []);

  const headers = useMemo(() => {
    return {
      "content-type": "application/json",
      "x-sync-token": token,
    };
  }, [token]);

  const pushSnapshot = useCallback(async () => {
    if (!token.trim()) {
      showMessage("error", "Missing sync token (x-sync-token).");
      return;
    }

    const confirmed1 = window.confirm(
      "Push will REPLACE ALL server data (users, products, customers, invoices, counters). Continue?"
    );
    if (!confirmed1) return;

    setBusy("push");
    setMessage(null);

    try {
      const payload = await backupRepo.exportData();
      const counts = getCounts(payload);

      const confirmed2 = window.confirm(
        `Push snapshot counts:\n` +
          `- users: ${counts.users}\n` +
          `- products: ${counts.products}\n` +
          `- customers: ${counts.customers}\n` +
          `- invoices: ${counts.invoices}\n` +
          `- invoiceItems: ${counts.invoiceItems}\n` +
          `- counters: ${counts.counters}\n\n` +
          `This will overwrite server. Proceed?`
      );
      if (!confirmed2) return;

      const res = await fetch("/api/sync", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; counts?: unknown; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(data?.error || `Push failed (${res.status})`);
      }

      showMessage("success", "Push completed.");
    } catch (err) {
      console.error("Sync push error:", err);
      showMessage("error", err instanceof Error ? err.message : vi.backup.invalidData);
    } finally {
      setBusy(null);
    }
  }, [headers, showMessage, token]);

  const pullSnapshot = useCallback(async () => {
    if (!token.trim()) {
      showMessage("error", "Missing sync token (x-sync-token).");
      return;
    }

    const confirmed1 = window.confirm(
      "Pull will REPLACE ALL local data (IndexedDB). Continue?"
    );
    if (!confirmed1) return;

    setBusy("pull");
    setMessage(null);

    try {
      const res = await fetch("/api/sync", {
        method: "GET",
        headers: {
          "x-sync-token": token,
        },
      });

      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const errMsg = raw && typeof raw === "object" && "error" in raw ? String((raw as any).error) : "";
        throw new Error(errMsg || `Pull failed (${res.status})`);
      }

      const payload = backupRepo.validatePayload(raw);
      const counts = getCounts(payload);

      const confirmed2 = window.confirm(
        `Pull snapshot counts:\n` +
          `- users: ${counts.users}\n` +
          `- products: ${counts.products}\n` +
          `- customers: ${counts.customers}\n` +
          `- invoices: ${counts.invoices}\n` +
          `- invoiceItems: ${counts.invoiceItems}\n` +
          `- counters: ${counts.counters}\n\n` +
          `This will overwrite local data. Proceed?`
      );
      if (!confirmed2) return;

      await backupRepo.importData(payload.data);

      showMessage("success", "Pull completed. Reloading…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error("Sync pull error:", err);
      showMessage("error", err instanceof Error ? err.message : vi.backup.invalidData);
    } finally {
      setBusy(null);
    }
  }, [showMessage, token]);

  return (
    <div className="mx-auto max-w-3xl rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Sync</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manual snapshot sync between local IndexedDB and Prisma/PostgreSQL.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="font-medium">Warning</div>
          <div className="mt-1 text-amber-800">
            Push/Pull are destructive. Push replaces server data. Pull replaces local data.
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Sync token (header <span className="font-mono">x-sync-token</span>)
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste SYNC_TOKEN here"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-600"
          />
          <p className="text-xs text-slate-500">
            This token is saved in your browser localStorage as <span className="font-mono">{LS_SYNC_TOKEN}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={pushSnapshot}
            disabled={busy !== null}
          >
            {busy === "push" ? "Pushing…" : "Push local → server (replace all)"}
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={pullSnapshot}
            disabled={busy !== null}
          >
            {busy === "pull" ? "Pulling…" : "Pull server → local (replace all)"}
          </button>
        </div>

        {message && (
          <div
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium",
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

