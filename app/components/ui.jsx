import { Loader2 } from "lucide-react";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vermilion focus-visible:outline-solid";

/* Mono, uppercase, wide tracking — the type used for anything you scan
   rather than read. Never set a sentence in it. */
export const LABEL = "font-mono text-[10px] uppercase tracking-[0.2em]";

const VARIANTS = {
  primary:
    "border-2 border-ink bg-ink text-bone hover:border-vermilion hover:bg-vermilion disabled:border-ink/30 disabled:bg-ink/30",
  secondary:
    "border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-bone disabled:border-ink/25 disabled:text-ink/30",
  ghost:
    "border-2 border-transparent bg-transparent text-ink/60 hover:border-ink hover:text-ink disabled:text-ink/25",
  danger:
    "border-2 border-transparent bg-transparent text-vermilion hover:border-vermilion disabled:text-vermilion/30",
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
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-180 ease-brb disabled:cursor-not-allowed ${FOCUS} ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** Square icon-only control, sized to line up with Button. */
export function IconButton({ variant = "secondary", className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 w-11 items-center justify-center transition-colors duration-180 ease-brb disabled:cursor-not-allowed ${FOCUS} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/** `accent` paints an 8px strip across the top, the way a tool card is marked. */
export function Card({ accent, className = "", bodyClassName = "p-6", children }) {
  return (
    <section className={`border-2 border-ink bg-paper ${className}`}>
      {accent && <div className={`h-2 ${accent}`} />}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Numbered section rule: mono index in an accent, then the Archivo heading. */
export function SectionHead({ index, title, accent = "text-vermilion", children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-6">
      <div className="flex items-baseline gap-4">
        <span className={`${LABEL} tracking-[0.24em] ${accent}`}>{index}</span>
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className={`${LABEL} mb-2 block text-ink/50`}>{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-2 block font-mono text-[10px] leading-relaxed tracking-[0.1em] text-ink/50">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-vermilion">
          {error}
        </span>
      )}
    </label>
  );
}

const CONTROL =
  "w-full border-2 border-ink bg-paper px-4 py-3 font-mono text-xs tracking-widest text-ink placeholder:text-ink/35 focus:outline-2 focus:outline-offset-2 focus:outline-vermilion focus:outline-solid";

export function Input({ className = "", ...props }) {
  return <input {...props} className={`${CONTROL} ${className}`} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select {...props} className={`${CONTROL} uppercase ${className}`}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea {...props} className={`${CONTROL} resize-y ${className}`} />;
}

const TONES = {
  error: { border: "border-vermilion", label: "text-vermilion", word: "Error" },
  info: { border: "border-cobalt", label: "text-cobalt", word: "Note" },
};

export function Alert({ children, tone = "error", label }) {
  if (!children) return null;
  const t = TONES[tone];

  return (
    <div
      role="status"
      className={`flex flex-col gap-2 border-2 ${t.border} bg-paper px-4 py-3 sm:flex-row sm:gap-4`}
    >
      <span className={`${LABEL} shrink-0 pt-0.5 ${t.label}`}>{label ?? t.word}</span>
      <p className="text-sm leading-relaxed text-ink/75">{children}</p>
    </div>
  );
}

const STATUS = {
  ready: { dot: "bg-moss", text: "text-moss" },
  caution: { dot: "bg-gold", text: "text-gold" },
  idle: { dot: "border border-ink/50", text: "text-ink/45" },
};

export function Status({ tone = "ready", children }) {
  const s = STATUS[tone];
  return (
    <span className={`${LABEL} flex items-center gap-2 tracking-[0.18em] ${s.text}`}>
      <span className={`h-1.5 w-1.5 ${s.dot}`} />
      {children}
    </span>
  );
}

/** Key/value row. Key dim, value at full ink — the spec-table pattern. */
export function SpecRow({ label, children, last = false }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-3 font-mono text-[11px] ${
        last ? "" : "border-b border-ink/15"
      }`}
    >
      <span className="uppercase tracking-[0.14em] text-ink/55">{label}</span>
      <span className="text-right text-ink">{children}</span>
    </div>
  );
}
