/**
 * Success header with title for the results view.
 */
export function ResultsHeader() {
  return (
    <div className="flex items-center gap-3 mb-4 pt-8">
      <svg
        className="size-6 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <h1 className="text-2xl font-bold">Wygenerowane fragmenty SOW</h1>
    </div>
  );
}
