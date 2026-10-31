"use client";

import { useCallback, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { errorMessage } from "@/services/ApiClient";

/** Runs an API call with a busy flag; failures are shown as an error toast. */
export function useSubmit() {
  const { toast } = useUI();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        return true;
      } catch (e) {
        toast(errorMessage(e), "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  return { busy, run };
}
