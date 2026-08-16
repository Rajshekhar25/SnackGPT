"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, messageFrom } from "@/lib/client";
import { AuthShell } from "./AuthShell";
import { Alert, Button, Field, Input } from "./ui";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFields({});

    const { ok, data } = await api("/api/auth/register", { method: "POST", body: form });
    if (!ok) {
      setFields(data.fields ?? {});
      setError(data.fields ? "" : messageFrom(data));
      setLoading(false);
      return;
    }

    // New accounts have no metrics yet, so send them straight to onboarding.
    router.replace("/profile");
    router.refresh();
  }

  return (
    <AuthShell
      index="Sign up"
      title="Create your account"
      subtitle="Takes a few seconds. No card, no spam."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="text-cobalt hover:text-vermilion">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Name" error={fields.name}>
          <Input
            autoComplete="name"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Riya"
          />
        </Field>

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

        <Field label="Password" error={fields.password} hint="At least 8 characters.">
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
          />
        </Field>

        <Alert>{error}</Alert>

        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
