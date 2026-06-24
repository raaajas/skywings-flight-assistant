import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <header className="sticky top-0 z-50 glass-header shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-wide text-white group">
            <div className="rounded-full bg-primary/20 p-2 border border-primary/30 group-hover:bg-primary/30 transition-all duration-300">
              <Plane className="h-4 w-4 text-primary group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <span>
              Sky<span className="text-primary font-extrabold">Wings</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "bg-primary/20 text-white border border-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "text-muted-foreground border border-transparent hover:bg-white/5 hover:text-white"
                }`
              }
            >
              Chat
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "bg-primary/20 text-white border border-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "text-muted-foreground border border-transparent hover:bg-white/5 hover:text-white"
                }`
              }
            >
              Bookings
            </NavLink>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-300"
              onClick={() => void logout()}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
