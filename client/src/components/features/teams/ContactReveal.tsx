import { useState } from "react";
import { Check, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import type { TeamContact } from "../../../api/types";
import { Button } from "../../ui";
import { channelLabel, contactHref } from "../../../lib/format";

const ICONS: Record<string, typeof Mail> = { DISCORD: MessageCircle, WHATSAPP: Phone, EMAIL: Mail };

/**
 * Instant Connect — the squad's Discord / WhatsApp / Email, revealed only once
 * you're a confirmed member (the API never sends `contact` to anyone else).
 */
export function ContactReveal({ contact, note }: { contact: TeamContact; note?: string }) {
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[contact.channel] ?? MessageCircle;
  const href = contactHref(contact.channel, contact.value);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="border-hairline bg-mint-bg/50 rounded-xl border p-4">
      <p className="label-caps text-mint-text">Instant Connect unlocked</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Icon className="text-mint-text h-4 w-4" aria-hidden />
        <span className="text-sm font-medium">{channelLabel(contact.channel)}</span>
        <code className="label-code text-ink bg-surface border-hairline rounded-sm border px-2 py-1">
          {contact.value}
        </code>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
          {href && (
            <a href={href} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ink">Open</Button>
            </a>
          )}
        </div>
      </div>
      <p className="label-mono-sm text-ink-muted mt-2">
        {note ?? `Reach the squad on ${channelLabel(contact.channel)} to start planning.`}
      </p>
    </section>
  );
}
