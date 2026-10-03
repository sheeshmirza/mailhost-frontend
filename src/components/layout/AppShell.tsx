"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { token, user, isLoading } = useAuth();

  const isLanding = pathname === "/";
  const isLogin = pathname === "/login" || pathname === "/login/";
  const isPublic = isLanding || isLogin;

  useEffect(() => {
    if (!isLoading && !isPublic && (!token || !user)) {
      router.replace("/login");
    }
  }, [isLoading, isPublic, token, user, router]);

  // If navigating to a protected route and still checking authentication
  if (!isPublic && isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <OfflineBanner />
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white font-bold text-lg shadow-sm animate-pulse dark:bg-teal-300 dark:text-teal-950">
          M
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
          Checking sign-in status...
        </p>
      </div>
    );
  }

  // If on a protected route without valid credentials, return null while redirecting
  if (!isPublic && (!token || !user)) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <OfflineBanner />
      <Navbar isLanding={isLanding} isLogin={isLogin} />
      <div className="flex flex-1">
        {!isPublic && <Sidebar />}
        <main
          className={
            isPublic
              ? "min-w-0 flex-1 w-full min-h-[calc(100vh-3.5rem)]"
              : "min-w-0 flex-1 w-full pl-0 lg:pl-60 min-h-[calc(100vh-3.5rem)] transition-all duration-200 ease-out"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
