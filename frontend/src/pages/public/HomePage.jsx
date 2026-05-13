import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Info Channel</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
              Learn with clarity, track with confidence.
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-xl">
              A focused learning portal for students, teachers, and admins. Start your journey or
              sign in to continue where you left off.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-md"
              >
                Create account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Today</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                New
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold">Profile completion</p>
                <div className="mt-3 h-2 w-full rounded-full bg-border">
                  <div className="h-2 w-2/3 rounded-full bg-primary" />
                </div>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold">Active course</p>
                <p className="mt-2 text-sm text-muted-foreground">Frontend Foundations</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold">Next session</p>
                <p className="mt-2 text-sm text-muted-foreground">Tomorrow, 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
