import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithEmail, loginWithGoogle } from "@/services/auth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none"></div>
      
      <Card className="w-full max-w-md glass-panel border border-white/5 shadow-2xl p-4 rounded-3xl relative overflow-hidden backdrop-blur-md animate-slide-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto rounded-2xl bg-primary/10 p-3 border border-primary/20 w-fit mb-3 animate-pulse-glow">
            <Plane className="h-6 w-6 text-primary rotate-45" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-white">Welcome Back</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Sign in to manage your flights with SkyWings</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border-white/5 bg-slate-900/60 focus-visible:ring-indigo-500/50 backdrop-blur-md text-sm text-white placeholder:text-muted-foreground/30 h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border-white/5 bg-slate-900/60 focus-visible:ring-indigo-500/50 backdrop-blur-md text-sm text-white placeholder:text-muted-foreground/30 h-10"
                required
              />
            </div>
            {error && <p className="text-xs font-semibold text-destructive pl-1">{error}</p>}
            <Button type="submit" className="w-full gradient-btn rounded-xl h-10 transition-all duration-300 font-bold" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative py-1 flex items-center justify-center">
            <span className="w-full border-t border-white/5"></span>
            <span className="absolute bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">or</span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl h-10 border-white/10 hover:bg-white/5 text-sm text-white hover:text-white transition-all duration-300"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              loginWithGoogle().catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
            }}
          >
            Continue with Google
          </Button>
          <p className="text-center text-xs text-muted-foreground pt-2">
            Don't have an account?{" "}
            <Link className="text-primary font-semibold underline-offset-4 hover:underline" to="/signup">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
