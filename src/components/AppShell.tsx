"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/hooks/useSession";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { UIProvider } from "./UIProvider";

const PUBLIC_PATHS = ["/login"];

function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const path = usePathname();

  return (
    <div className="app">
      <Sidebar open={menu} onNavigate={() => setMenu(false)} />
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <main className="main">
        <Topbar onMenu={() => setMenu(true)} />
        {/* keyed by route so each screen remounts and plays its entrance animation */}
        <div className="view" key={path}>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Sends signed-out visitors to /login and signed-in ones away from it. */
function AuthRedirect() {
  const session = useSession();
  const path = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(path);

  useEffect(() => {
    if (session === null && !isPublic) router.replace("/login");
    if (session && isPublic) router.replace("/");
  }, [session, isPublic, router]);

  return null;
}

/**
 * Always renders its children so every route segment is rendered on the server
 * (required for instant-navigation validation). Screens wait for the session via <ScreenGate>.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();

  return (
    <UIProvider>
      <AuthRedirect />
      {PUBLIC_PATHS.includes(path) ? children : <Shell>{children}</Shell>}
    </UIProvider>
  );
}
