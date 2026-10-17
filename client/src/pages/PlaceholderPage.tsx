import { OpenSlot } from "../components/ui/Tag";

/** Simple "not built yet" screen for nav destinations owned by later phases. */
export default function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-ink-muted mt-2 text-sm">{note}</p>
      <div className="mt-6">
        <OpenSlot>// slot reserved — see TODO.md for the phase that fills this</OpenSlot>
      </div>
    </div>
  );
}
