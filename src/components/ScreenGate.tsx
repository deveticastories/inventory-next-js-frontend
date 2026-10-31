"use client";

import type { ReactNode } from "react";
import { useSession } from "@/hooks/useSession";
import PageSkeleton from "./PageSkeleton";

/** Shows a skeleton until a signed-in session is available, then the screen (which loads its own data). */
export default function ScreenGate({ children }: { children: ReactNode }) {
  const session = useSession();
  return session ? <>{children}</> : <PageSkeleton />;
}
