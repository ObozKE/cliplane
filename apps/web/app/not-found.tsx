import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 max-w-md w-full">
        <span className="text-4xl font-extrabold text-neutral-400">404</span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          The page or resource you are looking for does not exist, has been moved, or is restricted.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
