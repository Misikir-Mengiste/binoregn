"use client";

import { useRef, useState, type SubmitEvent } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

type CodeStep = "email" | "code";
type Variant = "sign-in" | "sign-up";

const VARIANT_COPY: Record<
  Variant,
  { title: string; description: string; helper: string; linkHref: string; linkText: string }
> = {
  "sign-in": {
    title: "Welcome back",
    description: "Continue with Google or receive a 6-digit email code.",
    helper: "New here?",
    linkHref: "/sign-up",
    linkText: "Sign up",
  },
  "sign-up": {
    title: "Create your account",
    description: "Use Google or email code to start your creator profile.",
    helper: "Already have an account?",
    linkHref: "/sign-in",
    linkText: "Sign in",
  },
};

export function AuthEntry({ variant }: { variant: Variant }) {
  const router = useRouter();
  const [codeStep, setCodeStep] = useState<CodeStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const codeSlots = Array.from({ length: 6 }, (_, index) => code[index] ?? "");
  const copy = VARIANT_COPY[variant];

  async function requestCode() {
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

  async function handleRequestCode(event: SubmitEvent) {
    event.preventDefault();
    await requestCode();
  }

  // Resend clears the old digits (and the error) and re-focuses the first
  // box before requesting a fresh code.
  async function handleResend() {
    setCode("");
    setError(null);
    codeRefs.current[0]?.focus();
    await requestCode();
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

  function updateCode(index: number, value: string) {
    if (!value) {
      const nextCode = code.split("");
      nextCode[index] = "";
      setCode(nextCode.join(""));
      return;
    }

    const digits = value.replace(/\D/g, "");
    if (!digits) return;

    const next = code.split("");
    for (let offset = 0; offset < digits.length && index + offset < 6; offset += 1) {
      next[index + offset] = digits[offset];
    }
    setCode(next.join(""));

    const nextIndex = Math.min(index + digits.length, 5);
    codeRefs.current[nextIndex]?.focus();
  }

  // maxLength={1} truncates a pasted code on `onChange`, so distribute the
  // pasted digits across the boxes here instead.
  function handleCodePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    const next = code.split("");
    for (let offset = 0; offset < digits.length && index + offset < 6; offset += 1) {
      next[index + offset] = digits[offset];
    }
    setCode(next.join(""));
    const nextIndex = Math.min(index + digits.length, 5);
    codeRefs.current[nextIndex]?.focus();
  }

  function handleCodeKeyDown(index: number, event: KeyboardEvent) {
    if (event.key !== "Backspace") return;
    if (codeSlots[index]) return;
    if (index === 0) return;
    codeRefs.current[index - 1]?.focus();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Branded background — brand gradient + soft blurred color blobs. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-100 via-surface-100 to-blue-100" />
      <div className="pointer-events-none absolute -left-24 top-4 -z-10 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-4 -z-10 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/30 blur-3xl" />

      <Link href="/" className="mb-6 flex items-center">
        <Logo className="h-9" />
      </Link>

      <div className="relative w-full max-w-sm rounded-[18px] border border-white/60 bg-card/90 px-6 py-8 shadow-card backdrop-blur">
        {codeStep === "code" ? (
          <div className="flex flex-col gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-teal-100 text-teal-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-foreground">
                Check your inbox
              </h1>
              <p className="mt-2 text-sm text-ink-600">
                We sent a 6-digit code to <span className="font-medium">{email}</span>.
              </p>
            </div>
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {codeSlots.map((slot, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      codeRefs.current[index] = element;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={slot}
                    onChange={(event) => updateCode(index, event.target.value)}
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                    onPaste={(event) => handleCodePaste(index, event)}
                    className="h-12 w-full min-w-0 flex-1 rounded-[12px] border border-border text-center text-base font-semibold text-foreground outline-none focus:border-teal-600"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-12 rounded-[14px]" disabled={loading}>
                {loading ? "Verifying…" : "Verify & continue"}
                <MoveRight className="ml-2 h-4 w-4" />
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
              <button
                type="button"
                className="text-sm text-ink-600 underline underline-offset-2"
                onClick={handleResend}
                disabled={loading}
              >
                Resend code
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-[22px] font-bold text-foreground">{copy.title}</h1>
              <p className="mt-2 text-sm text-ink-600">{copy.description}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-[14px] text-sm font-semibold"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.23 1.52 7.66 2.8l5.25-5.25C33.2 3.6 28.98 1.5 24 1.5 14.82 1.5 6.9 6.78 3.1 14.48l6.12 4.75C11.04 13.44 16.9 9.5 24 9.5Z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.5 24c0-1.58-.15-2.97-.42-4.32H24v8.18h12.6c-.54 2.86-2.2 5.28-4.68 6.9l7.14 5.53C43.2 36.4 46.5 30.77 46.5 24Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M9.22 28.23A14.4 14.4 0 0 1 8.5 24c0-1.46.25-2.88.72-4.23l-6.12-4.75C1.76 17.57 1.5 20.72 1.5 24c0 3.28.26 6.43 1.6 9.23l6.12-4.75Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M24 46.5c6.48 0 11.92-2.14 15.9-5.81l-7.14-5.53c-1.98 1.34-4.52 2.14-8.76 2.14-7.1 0-12.96-3.94-15.06-9.73l-6.12 4.75C6.9 41.22 14.82 46.5 24 46.5Z"
                  />
                </svg>
              </span>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  className="h-12 rounded-[12px]"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-12 rounded-[14px]" disabled={loading}>
                {loading ? "Sending…" : "Continue with email"}
                <MoveRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-ink-600">
                We&apos;ll send a 6-digit code — no password needed.
              </p>
              <p className="text-sm text-ink-600">
                {copy.helper}{" "}
                <Link
                  href={copy.linkHref}
                  className="font-medium text-teal-600 underline underline-offset-2"
                >
                  {copy.linkText}
                </Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
