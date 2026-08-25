export default function AffiliatePlaceholder({
  productName = "Recommended Book",
}: {
  productName?: string;
}) {
  return (
    <div className="my-6 flex w-full flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 className="text-sm font-semibold text-text-main">
          {productName}
        </h4>

        <p className="mt-1 text-xs text-text-muted">
          Recommended resource from SajibAtlas
        </p>
      </div>

      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white opacity-80"
      >
        Buy / Learn More
      </button>
    </div>
  );
}