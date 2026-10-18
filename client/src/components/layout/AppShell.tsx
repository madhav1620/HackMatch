import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BadgeCheck, Bookmark, Compass, Inbox, LogOut, Plus, Search, User, Users, UsersRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";

const TABS = [
  { to: "/", label: "Discover", icon: Compass, end: true },
  { to: "/talent", label: "Talent", icon: Users },
  { to: "/squads", label: "Squads", icon: UsersRound },
  { to: "/requests", label: "Requests", icon: Inbox },
  { to: "/profile/me", label: "Profile", icon: User },
];

/** Shared authed chrome: top bar (search + post + user) and mobile bottom tabs. */
export function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(term.trim() ? `/?search=${encodeURIComponent(term.trim())}` : "/");
  };

  return (
    <div className="bg-dotmatrix min-h-screen">
      <header className="border-hairline bg-surface/95 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 md:px-6">
          <NavLink to="/" className="font-display text-[17px] font-extrabold tracking-tight">
            HackMatch
          </NavLink>
          <span className="label-caps text-ink-muted border-hairline hidden rounded-sm border px-2 py-1 sm:inline-flex">
            Campus League
          </span>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {[
              { to: "/squads", label: "Squads" },
              { to: "/requests", label: "Requests" },
              { to: "/talent", label: "Talent" },
            ].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `press label-mono-sm rounded-lg px-2.5 py-2 ${
                    isActive ? "bg-surface-sunk text-ink" : "text-ink-muted hover:text-ink"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto flex items-center gap-2">
            <label className="border-hairline hidden items-center gap-2 rounded-lg border bg-surface-sunk px-3 py-2 lg:flex">
              <Search className="text-ink-muted h-4 w-4" aria-hidden />
              <span className="sr-only">Search hackathons</span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="label-mono-sm w-40 bg-transparent outline-none"
                placeholder="Search hackathons, skills…"
              />
            </label>

            <ThemeToggle />

            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `press border-hairline rounded-lg border px-3 py-2 ${isActive ? "bg-ink text-canvas" : "bg-surface"}`
              }
              title="Saved hackathons"
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              <span className="sr-only">Saved</span>
            </NavLink>

            {isOrganizer && (
              <NavLink
                to="/admin/hackathons/new"
                className={({ isActive }) =>
                  `press border-hairline hidden items-center gap-1.5 rounded-lg border px-3 py-2 sm:inline-flex ${
                    isActive ? "bg-ink text-canvas" : "bg-surface"
                  }`
                }
                title="Post a hackathon"
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="label-mono-sm">Post</span>
              </NavLink>
            )}

            <NavLink
              to="/profile/me"
              className="press border-hairline flex items-center gap-2 rounded-lg border bg-surface px-3 py-2"
            >
              <span className="label-mono-sm max-w-[110px] truncate">{user?.name ?? "Hacker"}</span>
              {user?.verified && <BadgeCheck className="text-link h-4 w-4" aria-label="Verified" />}
            </NavLink>

            <SignOut />
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-24 md:px-6">
        <Outlet />
      </main>

      <nav
        className="border-hairline bg-surface animate-pop-in fixed inset-x-0 bottom-0 z-30 border-t md:hidden"
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-between px-2">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `press flex flex-1 flex-col items-center gap-1 px-2 py-2 ${
                  isActive ? "text-primary" : "text-ink-muted"
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="label-caps">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Isolated sign-out so the mutation/redirect logic isn't tangled with the shell. */
function SignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      className="press text-ink-muted p-2"
      aria-label="Sign out"
      title="Sign out"
      onClick={async () => {
        await logout();
        navigate("/auth");
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
    </button>
  );
}
