"use client";

import { Quicksand } from "next/font/google";
import { useEffect, useState } from "react";

const quicksand700 = Quicksand({
  weight: "700",
  subsets: ["latin"],
});

export default function Lokal() {
  const TOKEN_KEY = "lokal:splash:lastShown";
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    // Determine whether to show based on last shown timestamp
    let shouldShow = true;
    try {
      const last = localStorage.getItem(TOKEN_KEY);
      if (last) {
        const lastMs = Number(last);
        if (!Number.isNaN(lastMs)) {
          shouldShow = Date.now() - lastMs >= WINDOW_MS;
        }
      }
    } catch (_) {
      // localStorage not available; default to showing once
      shouldShow = true;
    }

    setShow(shouldShow);

    if (shouldShow) {
      // Save token immediately and schedule unmount after animation completes
      try {
        localStorage.setItem(TOKEN_KEY, String(Date.now()));
      } catch (_) {
        // ignore
      }

      const timeout = setTimeout(() => setShow(false), 3000); // ~3s total
      return () => clearTimeout(timeout);
    }
  }, []);

  // Avoid hydration mismatch: render nothing until we've decided
  if (!show) return null;

  return (
    <div
      className={`${quicksand700.className} h-screen w-screen flex items-center justify-center text-max bg-[#004AAD] animate-[float_5s_ease-in-out_infinite,fade-out_0.5s_ease-out_1.5s_forwards] fixed inset-0 z-50`}
      aria-hidden={!show}
      role="presentation"
    >
      {/* Responsive wrapper to preserve proportions and scale down on mobile */}
      <div className="flex items-center justify-center aspect-[5/1] w-[90vw] max-w-[1100px] origin-center scale-[0.5] sm:scale-[0.65] md:scale-[0.8] lg:scale-100">
        <h1 className="text-white flex leading-none">
          <span className="animate-[grow-tall_2s_ease-out_forwards] origin-bottom">l</span>
          <span>o</span>
          <span className="relative">
            <span className="absolute left-[24px] rounded-full top-[60%] w-[38px] h-0 bg-white animate-[extend-leg_2s_ease-out_forwards]" />
            k
          </span>
          <span>a</span>
          <span className="animate-[grow-tall_2s_ease-out_forwards] origin-bottom">l</span>
        </h1>
      </div>
    </div>
  );
}