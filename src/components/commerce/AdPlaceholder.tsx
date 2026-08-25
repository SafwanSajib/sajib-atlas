export default function AdPlaceholder({
  position = "content",
}: {
  position?: string;
}) {
  return (
    <div
      className="my-8 flex min-h-[100px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-text-muted"
      aria-label={`Advertisement placeholder: ${position}`}
    >
      <span>Advertisement Space · {position}</span>
      <span className="mt-1 text-xs">
        Reserved for future advertising
      </span>
    </div>
  );
}