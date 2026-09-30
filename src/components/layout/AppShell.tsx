"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-bold text-lg shadow-sm animate-pulse">
          R
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
          Verifying session...
        </p>
      </div>
    );
  }

  // If on a protected route without valid credentials, return null while redirecting
  if (!isPublic && (!token || !user)) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar isLanding={isLanding} isLogin={isLogin} />
      <div className="flex flex-1">
        {!isPublic && <Sidebar />}
        <main
          className={
            isPublic
              ? "flex-1 w-full min-h-[calc(100vh-3.5rem)]"
              : "flex-1 w-full pl-0 lg:pl-56 min-h-[calc(100vh-3.5rem)] pt-6 pb-16 transition-all duration-300 ease-in-out"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
