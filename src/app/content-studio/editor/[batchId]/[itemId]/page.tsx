import { notFound } from "next/navigation";
import EditorialPersistenceFailure from "@/components/content-studio/EditorialPersistenceFailure";
import EditorialWorkspace from "@/components/content-studio/EditorialWorkspace";
import { loadEditorialRouteAction } from "@/lib/content-studio/editorial/actions";

export default async function EditorialEditorPage({ params }: { params: Promise<{ batchId: string; itemId: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { batchId, itemId } = await params;
  if (!/^[0-9]{3,4}$/.test(batchId) || !/^[0-9]{3}--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(itemId)) notFound();
  const resolution = await loadEditorialRouteAction(batchId, itemId);
  if (resolution.kind === "not-found") notFound();
  if (resolution.kind === "persistence-failure") {
    return (
      <main className="shell">
        <EditorialPersistenceFailure
          message={resolution.message}
          batchNumber={batchId}
          itemParam={itemId}
          replayAvailable={resolution.replayAvailable}
        />
      </main>
    );
  }
  return (
    <main className="shell">
      <EditorialWorkspace key={`${resolution.view.batchId}/${resolution.view.itemId}/${resolution.view.revision}`} view={resolution.view} batchNumber={batchId} itemParam={itemId} />
    </main>
  );
}
