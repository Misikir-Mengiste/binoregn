"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AnnouncementForm({ recipients }: { recipients: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (
      !window.confirm(
        `Send this announcement to ${recipients} creator${recipients === 1 ? "" : "s"}? It can't be unsent.`,
      )
    ) {
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Could not send the announcement");
      }
      setTitle("");
      setBody("");
      setMessage({
        ok: true,
        text: `Sent to ${data.data.recipients} creator${data.data.recipients === 1 ? "" : "s"}.`,
      });
      router.refresh();
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[10px] border border-border bg-card p-5 shadow-card"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-title">Title</Label>
        <Input
          id="announcement-title"
          required
          maxLength={120}
          className="h-10 rounded-[8px]"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-body">Message</Label>
        <textarea
          id="announcement-body"
          required
          maxLength={2000}
          rows={4}
          className="rounded-[8px] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-teal-600"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-400">
          Goes to {recipients} approved creator{recipients === 1 ? "" : "s"}.
        </p>
        <Button type="submit" className="h-10 rounded-[8px]" disabled={sending}>
          <Megaphone className="h-4 w-4" />
          {sending ? "Sending…" : "Send announcement"}
        </Button>
      </div>
      {message ? (
        <p
          className={
            message.ok ? "text-sm text-teal-700" : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
