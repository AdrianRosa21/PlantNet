"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "./ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 p-8">
        <Skeleton className="w-full h-12 rounded-lg" />
        <Skeleton className="w-full h-40 rounded-lg" />
        <Skeleton className="w-3/4 h-8 rounded-lg" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}