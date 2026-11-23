"use client";

// ============================================================================
// TIZGIN — Official Recognizable Brand Logo Component
// Combines a Water Tap (faucet valve), a falling Water Droplet, and a Fresh
// Green Leaf (#35C759) on Deep Navy (#082B55) & Ocean Blue (#0877C9).
// ============================================================================

import React from "react";

export function TizginLogo({
  size = 42,
  showText = true,
  className = ""
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl shadow-md overflow-hidden border border-sky-400/30"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #082B55 0%, #0877C9 100%)"
        }}
      >
        <svg
          viewBox="0 0 64 64"
          width={size * 0.84}
          height={size * 0.84}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Water Tap / Faucet Handle & Spout at top */}
          <rect x="24" y="6" width="16" height="4" rx="2" fill="#E0F2FE" />
          <rect x="30" y="10" width="4" height="5" fill="#bae6fd" />
          <path
            d="M14 16H38C42.4183 16 46 19.5817 46 24V27H39V24C39 22.8954 38.1046 22 37 22H14V16Z"
            fill="#FFFFFF"
          />
          {/* Water Droplet emerging below tap */}
          <path
            d="M35 28C35 28 24 40.2 24 47.5C24 53.3 28.9 58 35 58C41.1 58 46 53.3 46 47.5C46 40.2 35 28 35 28Z"
            fill="url(#dropletGrad)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          {/* Inner highlight on droplet */}
          <path
            d="M29.5 46C29.5 49.5 31.5 52 34.5 52.8"
            stroke="#E0F2FE"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Fresh Green Leaf (#35C759) cradling the water droplet */}
          <path
            d="M12 45C12 36 21 33 29 38C29 46 22 53 13 52C12.3 50 12 47.5 12 45Z"
            fill="#35C759"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
          <path
            d="M14 50C18 46 22 43 27 39"
            stroke="#082B55"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="dropletGrad" x1="24" y1="28" x2="46" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0877C9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-[#082B55] dark:text-white">
              TIZGIN
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[#35C759]/20 text-[#16A34A] dark:text-[#35C759] border border-[#35C759]/40">
              SMART WATER
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
            Water Conservation &amp; Control
          </span>
        </div>
      )}
    </div>
  );
}
