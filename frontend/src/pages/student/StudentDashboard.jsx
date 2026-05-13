import { Link } from 'react-router-dom';

function StudentDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-lg">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Student</p>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold">Dashboard</h1>
          <p className="mt-3 text-base text-muted-foreground">
            This is your starter dashboard. Course progress, enrollments, and profile widgets will
            appear here next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Back to home
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
