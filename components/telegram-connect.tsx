"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

// Connect the signed-in user's Telegram (creator or admin). Opens the
// bot with a one-time start token; the bot webhook finishes the link.
export function TelegramConnect({
  configured,
  connected,
  description,
}: {
  configured: boolean;
  connected: boolean;
  description: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    // Open the tab synchronously (popup blockers), then point it at the
    // bot once the server returns the link.
    const tab = window.open("", "_blank");
    try {
      const response = await fetch("/api/telegram/link", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not start Telegram linking");
      }
      if (tab) tab.location.href = body.data.url;
      else window.location.href = body.data.url;
      setWaiting(true);
    } catch (err) {
      tab?.close();
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/telegram/link", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not disconnect Telegram");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-[16px] border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-teal-100 text-teal-700">
          <Send className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[15px] font-bold text-foreground">
            Telegram {connected ? "· Connected" : ""}
          </p>
          <p className="text-sm text-ink-600">{description}</p>
          {waiting && !connected ? (
            <p className="mt-1 text-xs text-ink-400">
              Press <b>Start</b> in Telegram, then{" "}
              <button
                type="button"
                className="font-semibold text-teal-700 underline"
                onClick={() => router.refresh()}
              >
                refresh
              </button>
              .
            </p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
      {!configured ? (
        <p className="text-xs text-ink-400">Not available yet</p>
      ) : connected ? (
        <Button
          variant="outline"
          className="h-10 rounded-[10px]"
          disabled={busy}
          onClick={disconnect}
        >
          Disconnect
        </Button>
      ) : (
        <Button className="h-10 rounded-[10px]" disabled={busy} onClick={connect}>
          <Send className="h-4 w-4" />
          Connect Telegram
        </Button>
      )}
    </section>
  );
}
