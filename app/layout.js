import { Archivo, Space_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "SnackGPT — Calorie & Macro Tracker",
  description:
    "Log food in plain English, let AI estimate the macros, and get suggestions for what to eat next.",
};

/** Frames the viewport as a printed sheet. 26px inset, never moves. */
function CropMarks() {
  const arm = "pointer-events-none fixed z-40 h-5 w-5 border-ink/40";
  return (
    <div aria-hidden="true" className="hidden sm:block">
      <div className={`${arm} top-[26px] left-[26px] border-t border-l`} />
      <div className={`${arm} top-[26px] right-[26px] border-t border-r`} />
      <div className={`${arm} bottom-[26px] left-[26px] border-b border-l`} />
      <div className={`${arm} bottom-[26px] right-[26px] border-b border-r`} />
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Print-screen texture. Sits above the page, ignores the pointer. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 opacity-45 mix-blend-multiply [background-image:repeating-linear-gradient(0deg,rgba(16,16,20,0.055)_0px,rgba(16,16,20,0.055)_1px,transparent_1px,transparent_3px)]"
        />
        <CropMarks />
        {children}
      </body>
    </html>
  );
}
