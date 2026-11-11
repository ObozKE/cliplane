"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive Dot Matrix Grid Background with Cursor Mint Glow Mask
 * Replicating the exact aesthetic and cursor interaction from autoclips.app
 */
export function LpGridBackground() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      gridRef.current.style.setProperty("--lp-mx", `${e.clientX}px`);
      gridRef.current.style.setProperty("--lp-my", `${e.clientY}px`);
      if (!gridRef.current.classList.contains("is-live")) {
        gridRef.current.classList.add("is-live");
      }
    };

    const handleMouseLeave = () => {
      if (!gridRef.current) return;
      gridRef.current.classList.remove("is-live");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" ref={gridRef} className="lp-grid">
      <span className="lp-grid-line" />
      <span className="lp-grid-line lp-grid-line-r" />
    </div>
  );
}
