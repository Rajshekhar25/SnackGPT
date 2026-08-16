import { Salad } from "lucide-react";

const SIZES = {
  sm: { box: "h-8 w-8", glyph: "h-4 w-4", word: "text-base" },
  md: { box: "h-10 w-10", glyph: "h-5 w-5", word: "text-xl" },
  lg: { box: "h-14 w-14", glyph: "h-7 w-7", word: "text-3xl" },
};

/** SnackGPT mark: an ink tile, bone glyph. Square, never rounded, never shadowed. */
export function Brand({ size = "md", wordmark = true }) {
  const s = SIZES[size];

  return (
    <span className="flex items-center gap-3">
      <span className={`flex ${s.box} shrink-0 items-center justify-center bg-ink`}>
        <Salad className={`${s.glyph} text-bone`} strokeWidth={1.75} />
      </span>
      {wordmark && (
        <span className={`${s.word} font-bold uppercase tracking-[-0.04em] text-ink`}>
          SnackGPT
        </span>
      )}
    </span>
  );
}
