type LogoProps = {
  variant?: 'full' | 'mark';
  size?: number;
  className?: string;
};

export function Logo({ variant = 'full', size = 32, className }: LogoProps) {
  const markSize = size;

  if (variant === 'mark') {
    return (
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <path
          d="M16 6v2.5M16 23.5V26M11 10.5C11 9.12 12.12 8 13.5 8h5a2.5 2.5 0 0 1 0 5h-5A2.5 2.5 0 0 0 11 15.5v1A2.5 2.5 0 0 0 13.5 19h5a2.5 2.5 0 0 1 0 5h-5A2.5 2.5 0 0 1 11 21.5"
          stroke="var(--accent-contrast)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M20 5.5 23 8.5l-3 3"
          stroke="var(--accent-contrast)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </svg>
    );
  }

  return (
    <svg
      width={(size / 32) * 120}
      height={size}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FairPay"
      className={className}
    >
      {/* Mark */}
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M16 6v2.5M16 23.5V26M11 10.5C11 9.12 12.12 8 13.5 8h5a2.5 2.5 0 0 1 0 5h-5A2.5 2.5 0 0 0 11 15.5v1A2.5 2.5 0 0 0 13.5 19h5a2.5 2.5 0 0 1 0 5h-5A2.5 2.5 0 0 1 11 21.5"
        stroke="var(--accent-contrast)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 5.5 23 8.5l-3 3"
        stroke="var(--accent-contrast)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Wordmark */}
      <text
        x="40"
        y="22"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="var(--text)"
        letterSpacing="-0.3"
      >
        FairPay
      </text>
    </svg>
  );
}
