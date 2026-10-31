"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "@/components/Button";
import { Field, Input, PasswordInput } from "@/components/Field";
import Icon from "@/components/Icon";
import { useUI } from "@/components/UIProvider";
import { login } from "@/services/AuthenticationServices";
import { errorMessage } from "@/services/ApiClient";

export default function LoginScreen() {
  const router = useRouter();
  const { toast } = useUI();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast("Enter email and password", "error");
    setBusy(true);
    try {
      const { user } = await login(email, password);
      toast(`Welcome, ${user.staffName}`);
      router.replace("/");
    } catch (err) {
      toast(errorMessage(err), "error");
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card card" onSubmit={submit}>
        <div className="login-brand">
          <span className="brand-mark">
            <Icon name="layers" size={18} stroke={2.4} />
          </span>
          <div>
            <div className="login-title">
              Stock<span>Link</span>
            </div>
            <small>Inventory · IND ⇄ UAE</small>
          </div>
        </div>
        <p className="login-sub">Sign in with your staff email and password.</p>
        <Field label="Email / Username">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@stocklink.in" autoFocus />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" icon="arrowRight" className="login-btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
