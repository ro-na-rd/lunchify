export default function LunchifyLogo({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="plate-grad" x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="accent-grad" x1="24" y1="4" x2="24" y2="44">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#plate-grad)" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.15" />
      {/* Fork - left */}
      <g transform="translate(7, 13)" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="5" y1="2" x2="5" y2="10" />
        <line x1="3" y1="2" x2="3" y2="7" />
        <line x1="7" y1="2" x2="7" y2="7" />
        <path d="M3 10 C3 12 5 13 5 13 C5 13 7 12 7 10" />
        <line x1="5" y1="13" x2="5" y2="22" />
      </g>
      {/* Spoon - right */}
      <g transform="translate(33, 13)" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <ellipse cx="5" cy="6" rx="4" ry="5" />
        <line x1="5" y1="11" x2="5" y2="22" />
      </g>
      {/* Clock hands in center */}
      <g transform="translate(24, 24)">
        <circle cx="0" cy="0" r="7" fill="white" fillOpacity="0.95" />
        <circle cx="0" cy="0" r="6" fill="white" fillOpacity="0" stroke="#3b82f6" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="0" y2="-4" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="0" y1="0" x2="3" y2="1" stroke="#1e293b" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="0" cy="0" r="1" fill="#3b82f6" />
      </g>
    </svg>
  );
}
