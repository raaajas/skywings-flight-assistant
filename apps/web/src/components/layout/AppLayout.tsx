import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Plane className="h-5 w-5 text-primary" />
            SkyWings Assistant
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`
              }
            >
              Chat
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`
              }
            >
              Bookings
            </NavLink>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
