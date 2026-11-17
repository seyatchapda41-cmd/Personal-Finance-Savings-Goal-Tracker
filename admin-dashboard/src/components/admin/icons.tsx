type IconProps = { className?: string };

// Inline so the panel carries no icon dependency.
function base(path: React.ReactNode, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export const Icons = {
  overview: ({ className }: IconProps) =>
    base(
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>,
      className,
    ),
  clients: ({ className }: IconProps) =>
    base(
      <>
        <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
        <circle cx="9" cy="7" r="3.25" />
        <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>,
      className,
    ),
  transactions: ({ className }: IconProps) =>
    base(
      <>
        <path d="M3 8h14l-3-3" />
        <path d="M21 16H7l3 3" />
      </>,
      className,
    ),
  payments: ({ className }: IconProps) =>
    base(
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
        <path d="M6 15h4" />
      </>,
      className,
    ),
  support: ({ className }: IconProps) =>
    base(
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-9 8.35 8.5 8.5 0 0 1-3.8-.9L3 20.5l1.55-4.65A8.38 8.38 0 0 1 3.65 11.5a8.5 8.5 0 0 1 8.35-8.5 8.38 8.38 0 0 1 9 8.5Z" />
      </>,
      className,
    ),
  audit: ({ className }: IconProps) =>
    base(
      <>
        <path d="M14 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-11Z" />
        <path d="M14 2.5v6h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </>,
      className,
    ),
  team: ({ className }: IconProps) =>
    base(
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20.5a7 7 0 0 1 14 0" />
      </>,
      className,
    ),
  settings: ({ className }: IconProps) =>
    base(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 15a1.65 1.65 0 0 0-1.51-1H1.4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 7 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.01c.2.6.75 1 1.4 1h.2a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </>,
      className,
    ),
  sun: ({ className }: IconProps) =>
    base(
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>,
      className,
    ),
  moon: ({ className }: IconProps) =>
    base(<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />, className),
  menu: ({ className }: IconProps) =>
    base(<path d="M4 7h16M4 12h16M4 17h16" />, className),
  close: ({ className }: IconProps) =>
    base(<path d="M6 6l12 12M18 6L6 18" />, className),
  search: ({ className }: IconProps) =>
    base(
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>,
      className,
    ),
  logout: ({ className }: IconProps) =>
    base(
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>,
      className,
    ),
  revenue: ({ className }: IconProps) =>
    base(
      <>
        <path d="M12 2v20" />
        <path d="M17 6.5c0-2-2.24-3-5-3s-5 .9-5 3 2.24 2.75 5 3.25 5 1.25 5 3.5-2.24 3.25-5 3.25-5-1.1-5-3" />
      </>,
      className,
    ),
  goals: ({ className }: IconProps) =>
    base(
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </>,
      className,
    ),
  bot: ({ className }: IconProps) =>
    base(
      <>
        <rect x="5" y="7" width="14" height="11" rx="3" />
        <circle cx="9.5" cy="12.5" r="1.1" fill="currentColor" />
        <circle cx="14.5" cy="12.5" r="1.1" fill="currentColor" />
        <path d="M9 18.5v2.2" />
        <path d="M15 18.5v2.2" />
        <path d="M12 4.5v2.5" />
        <circle cx="12" cy="3.6" r="1" fill="currentColor" />
      </>,
      className,
    ),
  reports: ({ className }: IconProps) =>
    base(
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-8" />
      </>,
      className,
    ),
  alert: ({ className }: IconProps) =>
    base(
      <>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 17.5h.01" />
      </>,
      className,
    ),
};
