import Button from "./Button";
import Notice from "./Notice";
import PageSkeleton from "./PageSkeleton";

/** Skeleton while a screen's first load is running, or the error with a retry. */
export default function LoadState({ error, onRetry }: { error?: string; onRetry: () => void }) {
  if (!error) return <PageSkeleton />;
  return (
    <Notice tone="warn">
      <div className="row" style={{ alignItems: "center" }}>
        <span>{error}</span>
        <Button size="sm" variant="ghost" icon="refresh" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Notice>
  );
}
