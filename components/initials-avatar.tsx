export function InitialsAvatar({
  email,
  size = "md",
}: {
  email: string;
  size?: "sm" | "md";
}) {
  const initial = (email.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      className={
        size === "sm"
          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-teal-600 text-xs font-semibold text-white"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-teal-600 text-sm font-semibold text-white"
      }
    >
      {initial}
    </div>
  );
}
