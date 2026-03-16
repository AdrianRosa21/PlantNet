"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "./ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
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
