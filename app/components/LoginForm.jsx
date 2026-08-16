"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, messageFrom } from "@/lib/client";
import { AuthShell } from "./AuthShell";
import { Alert, Button, Field, Input } from "./ui";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFields({});

    const { ok, data } = await api("/api/auth/login", { method: "POST", body: form });
    if (!ok) {
      setFields(data.fields ?? {});
      setError(data.fields ? "" : messageFrom(data));
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep tracking your day."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" error={fields.email}>
          <Input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" error={fields.password}>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
          />
        </Field>

        <Alert>{error}</Alert>

        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
