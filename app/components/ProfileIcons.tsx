export function RoofFlatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 24h48v8H0v-8zM4 20V8l20-8 20 8v12H4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RoofFlatLargeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 24h48v8H0v-8zM4 20V8l20-8 20 8v12H4z"
        fill="currentColor"
      />
      <rect x="8" y="12" width="12" height="8" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="28" y="12" width="12" height="8" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function RoofSawIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 24h48v8H0v-8zM4 20l10-12 10 12 10-12 14 12V8l-20-8-4 4-4-4L4 8v12z"
        fill="currentColor"
      />
    </svg>
  );
}
