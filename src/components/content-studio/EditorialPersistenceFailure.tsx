"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replayEditorialWriteThroughAction } from "@/lib/content-studio/editorial/actions";

export default function EditorialPersistenceFailure({
  message,
  batchNumber,
  itemParam,
  replayAvailable,
}: {
  message: string;
  batchNumber: string;
  itemParam: string;
  replayAvailable: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState(message);
  const [busy, setBusy] = useState(false);

  return (
    <section className="section">
      <h1>Editorial workspace</h1>
      <p role="alert">{notice}</p>
      {replayAvailable ? (
        <button
          type="button"
          className="button button-quiet"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void replayEditorialWriteThroughAction({ batchNumber, itemParam })
              .then(() => router.refresh())
              .catch((error: unknown) => {
                setNotice(error instanceof Error ? error.message : "Editorial workspace: persistence failure");
                setBusy(false);
              });
          }}
        >
          Replay write-through
        </button>
      ) : null}
    </section>
  );
}
