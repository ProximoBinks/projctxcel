// Icons are based on iconmonstr SVGs.
type IconName = "sparkle" | "check" | "users" | "quote" | "school" | "book" | "stethoscope" | "facebook" | "instagram" | "tiktok";

const icons: Record<IconName, React.ReactElement> = {
  sparkle: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 2l1.7 4.5L18 8l-4.3 1.5L12 14l-1.7-4.5L6 8l4.3-1.5L12 2zm7 9l.9 2.4L22 14l-2.1.6L19 17l-.9-2.4L16 14l2.1-.6L19 11zM5 11l.8 2.2L8 14l-2.2.8L5 17l-.8-2.2L2 14l2.2-.8L5 11z"
        fill="currentColor"
      />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.1 13.6l-3.6-3.6 1.4-1.4 2.2 2.2 4.9-4.9 1.4 1.4-6.3 6.3z"
        fill="currentColor"
      />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M8.2 11.2A3.8 3.8 0 1 0 8.2 3.6a3.8 3.8 0 0 0 0 7.6zm7.6 0a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6zM8.2 13c-3 0-5.4 2-5.4 4.5V20h10.8v-2.5c0-2.5-2.4-4.5-5.4-4.5zm7.6 0c-.7 0-1.4.1-2 .3 1.6.9 2.6 2.4 2.6 4.2V20h5.8v-2.5c0-2.5-2.4-4.5-6.4-4.5z"
        fill="currentColor"
      />
    </svg>
  ),
  school: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"
        fill="currentColor"
      />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M21 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM4 18V6h7v12H4zm16 0h-7V6h7v12z"
        fill="currentColor"
      />
    </svg>
  ),
  stethoscope: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M19 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6c-1.3 0-2.4-.84-2.82-2H16c-.55 2.8-3 5-5.97 5H10C6.69 17 4 14.31 4 11V4h2v7c0 2.21 1.79 4 4 4h.03c1.91 0 3.5-1.35 3.88-3.15C13.37 11.37 13 10.73 13 10V4h2v6c0 .37.21.68.51.85.19.82.7 1.52 1.37 1.98A3.98 3.98 0 0 0 19 16v3c0 1.1-.9 2-2 2h-3v2h3c2.21 0 4-1.79 4-4v-3c1.1 0 2-.9 2-2s-.9-2-2-2z"
        fill="currentColor"
      />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"
        fill="currentColor"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M22.675 0h-21.35C.595 0 0 .595 0 1.325v21.351C0 23.405.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.595 1.323-1.325V1.325C24 .595 23.405 0 22.675 0z"
        fill="currentColor"
      />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
        fill="currentColor"
      />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
        fill="currentColor"
      />
    </svg>
  ),
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ${className ?? ""}`}>
      {icons[name]}
    </span>
  );
}
