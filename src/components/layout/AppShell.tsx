"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar isLanding={isLanding} />
      <div className="flex flex-1">
        {!isLanding && <Sidebar />}
        <main
          className={
            isLanding
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
