"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Method = "code" | "password";
type CodeStep = "email" | "code";

// Shared sign-in entry for both creator and admin — Auth.js's
// auto-generated /api/auth/signin page can't drive the "otp"
// provider, since that's a two-step flow (request a code, then
// verify it) and the generic page only renders credentials fields
// in one shot without calling our custom /api/auth/request-otp
// route. Redirects everywhere go to /dashboard, a single
// role-aware landing spot, rather than hardcoding /admin (which
// was wrong for every creator using this page).
export default function SignInPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("code");
  const [codeStep, setCodeStep] = useState<CodeStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestCode(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not send the code");
      }
      setCodeStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("otp", { email, code, redirect: false });
      if (result?.error) {
        throw new Error("Incorrect or expired code — request a new one");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSignIn(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error("Incorrect email or password");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchMethod(next: Method) {
    setMethod(next);
    setCodeStep("email");
    setCode("");
    setPassword("");
    setError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-[18px] font-bold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-ink-600">
            {method === "code"
              ? codeStep === "email"
                ? "Enter your email and we'll send you a sign-in code."
                : `Enter the 6-digit code sent to ${email}.`
              : "Sign in with your email and password."}
          </p>
        </div>

        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => switchMethod("code")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              method === "code"
                ? "border-b-2 border-teal-600 text-teal-600"
                : "text-ink-400 hover:text-ink-600"
            }`}
          >
            Email code
          </button>
          <button
            type="button"
            onClick={() => switchMethod("password")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              method === "password"
                ? "border-b-2 border-teal-600 text-teal-600"
                : "text-ink-400 hover:text-ink-600"
            }`}
          >
            Password
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          {method === "code" ? (
            codeStep === "email" ? (
              <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    className="rounded-[8px]"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    className="rounded-[8px]"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading}>
                  {loading ? "Verifying…" : "Verify"}
                </Button>
                <button
                  type="button"
                  className="text-sm text-ink-600 underline underline-offset-2"
                  onClick={() => {
                    setCodeStep("email");
                    setCode("");
                    setError(null);
                  }}
                >
                  Use a different email
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pw-email">Email</Label>
                <Input
                  id="pw-email"
                  type="email"
                  required
                  autoFocus
                  className="rounded-[8px]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pw-password">Password</Label>
                <Input
                  id="pw-password"
                  type="password"
                  required
                  className="rounded-[8px]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-sm text-ink-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-teal-600 underline underline-offset-2"
                >
                  Sign up
                </Link>
              </p>
            </form>
          )}

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Continue with Google
          </Button>
        </div>
      </div>
    </main>
  );
}
