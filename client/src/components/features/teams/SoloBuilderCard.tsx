import { ArrowUpRight, Github } from "lucide-react";
import { Link } from "react-router-dom";
import type { SoloPost } from "../../../api/types";
import { Badge, Tag } from "../../ui";
import { availabilityLabel, initials, relativeTime, roleLabel } from "../../../lib/format";

const asLink = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** Solo builder card — the per-hackathon "Looking for Team" board. */
export function SoloBuilderCard({ post, hackathonName }: { post: SoloPost; hackathonName?: string }) {
  const { user } = post;
  const tone = user.availability === "OPEN" ? "mint" : user.availability === "SELECTIVE" ? "amber" : "neutral";

  return (
    <article className="animate-fade-up border-hairline bg-surface lift flex flex-col rounded-xl border p-5">
      <header className="flex items-center gap-3">
        <span
          className="border-hairline label-code grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-surface"
          aria-hidden
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="label-mono-sm text-ink-muted truncate">{roleLabel(user.primaryRole)}</p>
        </div>
        <Badge tone={tone} caps={false} className="ml-auto shrink-0">
          {availabilityLabel(user.availability)}
        </Badge>
      </header>

      {hackathonName && <p className="label-mono-sm text-ink-muted mt-3">{hackathonName}</p>}

      <p className="text-ink-muted mt-2 text-sm leading-6">{post.pitch}</p>

      {user.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.skills.slice(0, 5).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      )}

      <footer className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <span className="label-mono-sm text-ink-muted">{relativeTime(post.createdAt)}</span>
        <div className="ml-auto flex items-center gap-3">
          {user.githubUrl && (
            <a
              href={asLink(user.githubUrl)}
              target="_blank"
              rel="noreferrer"
              className="press label-mono-sm text-link inline-flex items-center gap-1 underline"
            >
              <Github className="h-3.5 w-3.5" aria-hidden />
              GitHub
            </a>
          )}
          <Link to={`/profile/${user.id}`} className="press label-mono-sm text-ink-muted inline-flex items-center gap-0.5 underline">
            Profile
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </footer>
    </article>
  );
}
