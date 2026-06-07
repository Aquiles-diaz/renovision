/* --- simple line icons (rectangles/lines only) --- */
import React from "react";

export function FIcon({ type }) {
  const s = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
  };
  const M = {
    rack: (
      <g>
        <rect x="2" y="9" width="20" height="8" rx="1" />
        <line x1="9" y1="9" x2="9" y2="17" />
        <line x1="15" y1="9" x2="15" y2="17" />
      </g>
    ),
    sideboard: (
      <g>
        <rect x="2.5" y="7" width="19" height="11" rx="1" />
        <line x1="12" y1="7" x2="12" y2="18" />
        <circle cx="9.5" cy="12.5" r=".6" fill="currentColor" />
        <circle cx="14.5" cy="12.5" r=".6" fill="currentColor" />
      </g>
    ),
    shelf: (
      <g>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
      </g>
    ),
    wardrobe: (
      <g>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <circle cx="10.5" cy="12" r=".7" fill="currentColor" />
        <circle cx="13.5" cy="12" r=".7" fill="currentColor" />
      </g>
    ),
    nightstand: (
      <g>
        <rect x="5" y="7" width="14" height="9" rx="1" />
        <line x1="5" y1="11" x2="19" y2="11" />
        <line x1="7.5" y1="16" x2="7.5" y2="19" />
        <line x1="16.5" y1="16" x2="16.5" y2="19" />
      </g>
    ),
    drawers: (
      <g>
        <rect x="5" y="4" width="14" height="16" rx="1" />
        <line x1="5" y1="9.3" x2="19" y2="9.3" />
        <line x1="5" y1="14.6" x2="19" y2="14.6" />
      </g>
    ),
  };
  return <svg {...s}>{M[type] || M.rack}</svg>;
}
