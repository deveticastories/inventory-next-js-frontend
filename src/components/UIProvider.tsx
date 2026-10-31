"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Button from "./Button";
import Icon from "./Icon";
import Modal from "./Modal";

type ToastKind = "success" | "error" | "info";

interface UIValue {
  toast: (msg: string, kind?: ToastKind) => void;
  confirm: (msg: ReactNode, onYes: () => void) => void;
}

const UIContext = createContext<UIValue | null>(null);

/** App-wide toast notifications and confirmation dialog. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);
  const [ask, setAsk] = useState<{ msg: ReactNode; onYes: () => void } | null>(null);
  const seq = useRef(0);

  const toast = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const confirm = useCallback((msg: ReactNode, onYes: () => void) => setAsk({ msg, onYes }), []);
  const close = useCallback(() => setAsk(null), []);

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      {ask && (
        <Modal
          title="Please confirm"
          onClose={close}
          width={440}
          footer={
            <>
              <Button variant="ghost" onClick={close}>
                No
              </Button>
              <Button
                onClick={() => {
                  setAsk(null);
                  ask.onYes();
                }}
              >
                Yes, continue
              </Button>
            </>
          }
        >
          <div className="confirm">
            <span className="confirm-icon">
              <Icon name="alert" size={22} />
            </span>
            <p>{ask.msg}</p>
          </div>
        </Modal>
      )}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-icon">
              <Icon name={t.kind === "error" ? "alert" : t.kind === "info" ? "info" : "check"} size={16} stroke={2.5} />
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const v = useContext(UIContext);
  if (!v) throw new Error("useUI must be used within UIProvider");
  return v;
}
