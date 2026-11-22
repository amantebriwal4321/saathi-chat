export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#e07a2f" />
        <circle cx="16" cy="14" r="6" fill="#fff8ee" />
        <path d="M8 24c2.4-4 5.4-6 8-6s5.6 2 8 6" stroke="#fff8ee" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl font-semibold tracking-tight">Saathi</span>
    </span>
  );
}
