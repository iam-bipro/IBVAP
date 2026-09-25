export default function IbvapLogo({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4fae8c" />
          <stop offset="100%" stopColor="#2e6b58" />
        </linearGradient>
      </defs>
      {/* Outer shield frame */}
      <path
        d="M20 3L6 8V19C6 28.5 12 35.8 20 38C28 35.8 34 28.5 34 19V8L20 3Z"
        fill="url(#logo-grad)"
        fillOpacity="0.15"
        stroke="url(#logo-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Target reticle / radar arcs */}
      <circle
        cx="20"
        cy="20"
        r="8"
        stroke="#4fae8c"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      <circle
        cx="20"
        cy="20"
        r="4"
        fill="#4fae8c"
      />
      {/* Reticle ticks */}
      <line x1="20" y1="8" x2="20" y2="12" stroke="#4fae8c" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="28" x2="20" y2="32" stroke="#4fae8c" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="20" x2="12" y2="20" stroke="#4fae8c" strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="20" x2="32" y2="20" stroke="#4fae8c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
