import { Bookmark } from "lucide-react";
import type { Hackathon } from "../../../api/types";
import { useToggleBookmark } from "../../../hooks/useHackathons";
import { useToast } from "../../ui";

/**
 * Bookmark + reminder toggle. Optimistic (see `useToggleBookmark`), so the icon
 * flips instantly and rolls back if the request fails.
 */
export function BookmarkButton({
  hackathon,
  withLabel = false,
  className = "",
}: {
  hackathon: Hackathon;
  withLabel?: boolean;
  className?: string;
}) {
  const toggle = useToggleBookmark();
  const toast = useToast();
  const saved = hackathon.bookmarked;

  return (
    <button
      type="button"
      className={`press relative z-10 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${
        saved ? "border-ink bg-ink text-canvas" : "border-hairline bg-surface text-ink hover:border-ink/40"
      } ${className}`}
      aria-pressed={saved}
      title={saved ? "Remove from saved" : "Save + set a deadline reminder"}
      onClick={() =>
        toggle.mutate(
          { hackathon, bookmarked: saved },
          {
            onSuccess: () =>
              toast.push(
                saved ? `${hackathon.name} removed from saved` : `${hackathon.name} saved · deadline reminder on`,
                saved ? "info" : "success",
              ),
            onError: () => toast.push("Couldn't update your saved list", "error"),
          },
        )
      }
      disabled={toggle.isPending}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden />
      {withLabel && <span className="label-mono-sm">{saved ? "Saved" : "Bookmark"}</span>}
      <span className="sr-only">{saved ? `Remove ${hackathon.name} from saved` : `Save ${hackathon.name}`}</span>
    </button>
  );
}
