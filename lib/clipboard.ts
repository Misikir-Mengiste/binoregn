// Copies text and says whether it worked. navigator.clipboard only exists
// in secure contexts (https / localhost) — on a phone opening the site over
// plain http (LAN, or before HTTPS is set up) it's undefined — so fall back
// to a hidden textarea + execCommand("copy"), with the extra selection
// call iOS needs.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.fontSize = "16px"; // stops iOS zooming in on focus
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length); // iOS
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
