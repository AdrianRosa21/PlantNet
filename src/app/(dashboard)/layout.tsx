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
        <header className="h-16 border-b border-slate-200/50 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 shadow-sm relative">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="text-white w-5 h-5 relative z-10" />
            </div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600">
              AgroAlerta <span className="text-teal-500">IA</span>
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-16">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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
            pathname === "/premium" ? "text-amber-500 bg-amber-50" : "text-muted-foreground"
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
