function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">{title}</h1>
            <p className="mt-3 text-base text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
