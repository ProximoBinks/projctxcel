// Icons are based on iconmonstr SVGs.
type IconName = "sparkle" | "check" | "users" | "quote";

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
  quote: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7.6 6C4.9 6 3 8.4 3 11.4c0 2.9 1.9 5.3 4.6 5.3h2.7V22h3.6V6H7.6zm8.8 0c-2.7 0-4.6 2.4-4.6 5.4 0 2.9 1.9 5.3 4.6 5.3h2.7V22H23V6h-6.6z"
        fill="currentColor"
      />
    </svg>
  ),
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ${className ?? ""}`}>
      {icons[name]}
    </span>
  );
}
