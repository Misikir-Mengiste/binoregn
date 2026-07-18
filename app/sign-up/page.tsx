"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Password sign-up always creates a CREATOR account — matches the
// existing OTP behavior (first successful sign-in creates the
// account with the default role) and architecture.md: the admin
// account is fixed/seeded, never self-registered.
export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Could not create your account",
        );
      }

      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error(
          "Account created — sign in from the Sign in page.",
        );
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-[18px] font-bold text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Sign up as a creator to start promoting products.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              autoFocus
              className="rounded-[8px]"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              className="rounded-[8px]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              className="rounded-[8px]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-xs text-ink-400">At least 8 characters.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              className="rounded-[8px]"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </Button>
          <p className="text-sm text-ink-600">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-teal-600 underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
