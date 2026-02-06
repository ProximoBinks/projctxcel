// Icons are based on iconmonstr SVGs.
type IconName = "sparkle" | "check" | "users" | "quote" | "school" | "book" | "stethoscope";

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
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ${className ?? ""}`}>
      {icons[name]}
    </span>
  );
}
