"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, User, Settings, Leaf, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-primary/10 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 shadow-sm relative">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Leaf className="text-primary-foreground w-5 h-5 relative z-10" />
            </div>
            <span className="font-black text-xl tracking-tight text-foreground">
              AgroAlerta <span className="text-primary">IA</span>
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background relative pb-16">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-background border-t border-primary/10 flex items-center justify-around px-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <Link href="/dashboard" className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
            pathname === "/dashboard" ? "text-primary bg-primary/5" : "text-muted-foreground"
          )}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Panel</span>
          </Link>
          <Link href="/profile" className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
            pathname === "/profile" ? "text-primary bg-primary/5" : "text-muted-foreground"
          )}>
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Perfil</span>
          </Link>
          <Link href="/premium" className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
            pathname === "/premium" ? "text-secondary bg-secondary/10" : "text-muted-foreground"
          )}>
            <Sparkles className="w-6 h-6" />
            <span className="text-[10px] font-medium">Planes PRO</span>
          </Link>
          <Link href="/settings" className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
            pathname === "/settings" ? "text-primary bg-primary/5" : "text-muted-foreground"
          )}>
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Ajustes</span>
          </Link>
        </nav>
      </div>
    </AuthGuard>
  );
}
