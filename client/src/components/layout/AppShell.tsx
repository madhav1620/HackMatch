import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BadgeCheck, Compass, LogOut, MessagesSquare, Plus, Search, Terminal, User, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { to: "/", label: "Discover", icon: Compass, end: true },
  { to: "/talent", label: "Talent", icon: Users },
  { to: "/squads", label: "Squads", icon: Terminal },
  { to: "/chats", label: "Chats", icon: MessagesSquare },
  { to: "/profile/me", label: "Profile", icon: User },
];

/**
 * Authed chrome: top bar (Stitch profile-light) + bottom tab bar (mobile-first 390px design).
 * Feed/board/talent screens arrive in Phases 3–4; this shell is the shared frame.
 */
export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/auth");
  }

  return (
    <div className="bg-dotmatrix flex min-h-screen flex-col">
      <header className="border-hairline bg-surface sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 md:px-6">
          <span className="font-display text-[17px] font-extrabold tracking-tight">HackMatch</span>
          <span className="label-caps text-ink-muted border-hairline hidden rounded-sm border px-2 py-1 sm:inline-flex">
            Campus League
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label className="border-hairline bg-surface-sunk hidden items-center gap-2 rounded-lg border px-3 py-2 md:flex">
              <Search className="text-ink-muted h-4 w-4" aria-hidden />
              <input
                className="label-mono-sm w-40 bg-transparent outline-none"
                placeholder="Search hackathons, skills…"
                aria-label="Search"
              />
            </label>
            <button
              className="press border-hairline inline-flex items-center gap-1 rounded-lg border px-3 py-2"
              title="Post a team requirement (Phase 4)"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="label-mono-sm hidden sm:inline">Post</span>
            </button>
            <div className="border-hairline flex items-center gap-2 rounded-lg border px-3 py-2">
              <span className="label-mono-sm max-w-[110px] truncate">{user?.name ?? "Hacker"}</span>
              {user?.verified && <BadgeCheck className="text-link h-4 w-4" aria-label="Verified" />}
            </div>
            <button className="press text-ink-muted" onClick={handleLogout} aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-6 md:px-6">
        <Outlet />
      </main>

      <nav className="border-hairline bg-surface fixed bottom-0 left-0 right-0 z-30 border-t">
        <div className="mx-auto flex max-w-[1280px] items-stretch justify-between px-2 md:justify-center md:gap-8">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `press flex flex-1 flex-col items-center gap-1 px-3 py-2 md:flex-none ${
                  isActive ? "text-accent" : "text-ink-muted"
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
