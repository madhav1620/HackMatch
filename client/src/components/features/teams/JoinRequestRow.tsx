import { ArrowUpRight, Check, X } from "lucide-react";
import type { JoinRequest } from "../../../api/types";
import { Badge, Button, Tag } from "../../ui";
import { commitmentLabel, initials, relativeTime, roleLabel } from "../../../lib/format";

const STATUS_TONE: Record<string, "mint" | "amber" | "neutral" | "danger"> = {
  PENDING: "amber",
  ACCEPTED: "mint",
  DECLINED: "danger",
  CANCELLED: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Withdrawn",
};

const asLink = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/**
 * One squad application. Squad leads get Accept / Decline; applicants get
 * Withdraw — the same row renders on the board detail and in My Requests.
 */
export function JoinRequestRow({
  request,
  teamLabel,
  busy = false,
  onAccept,
  onDecline,
  onCancel,
}: {
  request: JoinRequest;
  teamLabel?: string;
  busy?: boolean;
  onAccept?: (r: JoinRequest) => void;
  onDecline?: (r: JoinRequest) => void;
  onCancel?: (r: JoinRequest) => void;
}) {
  const name = request.requester?.name ?? "Applicant";
  const skills = request.requester?.skills ?? [];
  const hasActions = Boolean(onAccept || onDecline || onCancel);

  return (
    <article className="border-hairline bg-surface rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <span
          className="border-hairline label-code grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-surface"
          aria-hidden
        >
          {initials(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{name}</p>
            {request.requester?.primaryRole && (
              <span className="label-mono-sm text-ink-muted">{roleLabel(request.requester.primaryRole)}</span>
            )}
            <Badge tone={STATUS_TONE[request.status] ?? "neutral"} caps={false}>
              {STATUS_LABEL[request.status] ?? request.status}
            </Badge>
            <span className="label-mono-sm text-ink-muted ml-auto">{relativeTime(request.createdAt)}</span>
          </div>

          {teamLabel && <p className="label-mono-sm text-ink-muted mt-0.5">{teamLabel}</p>}

          {request.message && <p className="text-ink-muted mt-2 text-sm leading-6">{request.message}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {request.role && (
              <Badge tone="accent" caps={false}>
                Wants {roleLabel(request.role)}
              </Badge>
            )}
            <Badge tone="neutral" caps={false}>
              {commitmentLabel(request.commitment)}
            </Badge>
            {skills.slice(0, 4).map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            {request.portfolioUrl && (
              <a
                href={asLink(request.portfolioUrl)}
                target="_blank"
                rel="noreferrer"
                className="press label-mono-sm text-link inline-flex items-center gap-0.5 underline"
              >
                Portfolio
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>

      {hasActions && (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:pl-12">
          {onAccept && (
            <Button size="sm" variant="ink" disabled={busy} onClick={() => onAccept(request)}>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Accept
            </Button>
          )}
          {onDecline && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecline(request)}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Decline
            </Button>
          )}
          {onCancel && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCancel(request)}>
              Withdraw application
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
