import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          AI-Powered ATS Resume Builder
        </h1>
        <p className="text-lg text-muted-foreground">
          Create job-winning, ATS-optimized resumes with real-time scoring, Google X-Y-Z formula AI bullet rewriting, and instant PDF/DOCX exports.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
