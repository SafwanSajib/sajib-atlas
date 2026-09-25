import { notFound } from "next/navigation";
import StudioForm from "@/components/content-studio/StudioForm";
import { STUDIO_ACTION_MAX_DURATION_SECONDS } from "@/lib/content-studio/types";

export const maxDuration = 150;

if (STUDIO_ACTION_MAX_DURATION_SECONDS !== maxDuration) {
  throw new Error("Content studio maxDuration must match STUDIO_ACTION_MAX_DURATION_SECONDS.");
}

export default function ContentStudioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="shell">
      <header className="section">
        <p className="eyebrow">Development-only · Draft authoring</p>
        <h1>Content Production Studio</h1>
        <p>
          DRAFT — NOT CANONICAL. Source text becomes a PilotPackage draft through the existing Quality Gate.
          Generation is not publication. The persistent batch control is operator-triggered and separate from the synchronous Studio batch.
          This page is development-only.
        </p>
      </header>
      <StudioForm />
    </main>
  );
}
