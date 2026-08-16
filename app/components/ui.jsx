import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50",
  secondary:
    "bg-white text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400",
  ghost: "text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300",
  danger: "text-rose-600 hover:bg-rose-50 disabled:text-rose-300",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className = "", children }) {
  return (
    <section
      className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 ${className}`}
    >
      {children}
    </section>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none";

export function Input({ className = "", ...props }) {
  return <input {...props} className={`${CONTROL} ${className}`} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select {...props} className={`${CONTROL} ${className}`}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea {...props} className={`${CONTROL} resize-y ${className}`} />;
}

export function Alert({ children, tone = "error" }) {
  if (!children) return null;

  const tones = {
    error: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-sky-50 text-sky-800 ring-sky-200",
  };

  return (
    <p className={`rounded-lg px-3 py-2 text-sm ring-1 ${tones[tone]}`} role="status">
      {children}
    </p>
  );
}
