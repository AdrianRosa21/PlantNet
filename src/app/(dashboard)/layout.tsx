"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, User, Settings, Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-primary">AgroAlerta</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground">
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-4 pb-20">
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