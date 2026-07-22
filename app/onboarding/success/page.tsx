import { redirect } from "next/navigation";

export default function OnboardingSuccessPage() {
  redirect("/onboarding/pending");
}
