export default function LinkNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-2 rounded-[10px] border border-border bg-card p-8 text-center shadow-card">
        <p className="text-[15px] font-bold text-foreground">
          This link isn&apos;t valid
        </p>
        <p className="text-sm text-ink-600">
          It may have expired or been typed incorrectly — ask whoever shared
          it with you for a new link.
        </p>
      </div>
    </div>
  );
}
