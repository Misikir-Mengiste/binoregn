import nodemailer from "nodemailer";

// Generic SMTP transport, per the project's chosen email provider
// (see context/progress-tracker.md). Swap the transport here if
// that ever changes — nothing else in the app should import
// nodemailer directly.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  // Local catchers like Mailpit don't require (or support) auth — passing
  // an auth object with an empty user still makes nodemailer attempt
  // AUTH LOGIN and fail. Only authenticate when a user is configured.
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        // Gmail app passwords are displayed as four space-separated groups
        // ("abcd efgh ijkl mnop") for readability, but the real credential
        // is the 16 characters with no spaces — pasting the displayed form
        // into .env as-is makes SMTP auth fail silently (caught in
        // request-otp.ts, never surfaced to the user), so strip whitespace
        // defensively here.
        pass: process.env.SMTP_PASSWORD?.replace(/\s+/g, ""),
      }
    : undefined,
});

export async function sendOtpEmail(email: string, code: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Binoregn sign-in code",
    text: `Your sign-in code is ${code}. It expires in 10 minutes.`,
  });
}

// Sent to every ADMIN user (there's no separate super-admin role — see
// Role enum in schema.prisma) whenever a new order is placed.
export async function sendNewOrderAdminEmail(
  adminEmails: string[],
  order: {
    id: string;
    buyerName: string;
    productName: string;
    priceBirr: number;
    quantity: number;
    discountBirr?: number;
    discountCode?: string | null;
  },
) {
  if (adminEmails.length === 0) return;
  const discount = order.discountBirr ?? 0;
  const total = order.priceBirr * order.quantity - discount;
  const totalLine =
    discount > 0
      ? `\nDiscount code ${order.discountCode}: -${discount} ETB. Total: ${total} ETB.`
      : `\nTotal: ${total} ETB.`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: adminEmails,
    subject: `New order: ${order.productName}`,
    text: `${order.buyerName} placed an order for ${order.quantity} x ${order.productName} (${order.priceBirr} ETB each).${totalLine}\n\nOrder ID: ${order.id}`,
  });
}

// ---------------------------------------------------------------------
// Creator emails (progress-tracker 2026-11-21). Every creator
// notification is also emailed — see lib/notifications.ts. One simple,
// branded layout for all of them: heading, message, optional button.

/** Absolute base URL for links in emails (APP_URL, else AUTH_URL). */
export function appUrl() {
  const base = process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  return base.replace(/\/+$/, "");
}

function escapeEmailHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type CreatorEmail = {
  subject: string;
  heading: string;
  /** Plain text; blank lines become paragraphs. */
  body: string;
  /** App path ("/creator/earnings") or absolute URL for the button. */
  href?: string | null;
  ctaLabel?: string;
};

export function renderCreatorEmail(email: CreatorEmail, recipientName?: string | null) {
  const link = email.href
    ? email.href.startsWith("http") ? email.href : `${appUrl()}${email.href}`
    : null;
  const cta = email.ctaLabel ?? "Open your dashboard";
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
  const paragraphs = email.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const text = [
    greeting,
    "",
    email.heading,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...(link ? [`${cta}: ${link}`, ""] : []),
    "— Binoregn",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f9fd;font-family:Inter,Segoe UI,Arial,sans-serif;color:#070707">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f9fd;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e3eaed;border-radius:16px">
<tr><td style="padding:24px 28px 0;font-size:22px;font-weight:700;letter-spacing:-0.3px">Binoregn<span style="color:#0cb587">.</span></td></tr>
<tr><td style="padding:20px 28px 0;font-size:14px;color:#4b5552">${escapeEmailHtml(greeting)}</td></tr>
<tr><td style="padding:8px 28px 0;font-size:19px;font-weight:700;line-height:1.35">${escapeEmailHtml(email.heading)}</td></tr>
${paragraphs.map((p) => `<tr><td style="padding:10px 28px 0;font-size:14px;line-height:1.6;color:#30393a">${escapeEmailHtml(p).replace(/\n/g, "<br>")}</td></tr>`).join("\n")}
${link ? `<tr><td style="padding:22px 28px 0"><a href="${escapeEmailHtml(link)}" style="display:inline-block;background:#0cb587;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">${escapeEmailHtml(cta)}</a></td></tr>` : ""}
<tr><td style="padding:26px 28px 24px;font-size:12px;color:#8a928e;border-top:0">You're receiving this because you have a Binoregn creator account.</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject: email.subject, text, html };
}

/**
 * Sends one creator email. Never throws — a failed email must not undo
 * or fail the action that triggered it. Skipped when SMTP isn't set up.
 */
export async function sendCreatorEmail(
  to: string,
  email: CreatorEmail,
  recipientName?: string | null,
) {
  if (!process.env.SMTP_HOST) {
    console.info(`[mailer] SMTP not configured — skipped "${email.subject}" to creator`);
    return false;
  }
  try {
    const rendered = renderCreatorEmail(email, recipientName);
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, ...rendered });
    return true;
  } catch (error) {
    console.error(`[mailer] creator email "${email.subject}" failed:`, error);
    return false;
  }
}
