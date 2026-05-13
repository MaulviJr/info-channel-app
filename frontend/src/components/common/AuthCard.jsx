function AuthCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
      {children}
    </div>
  );
}

export default AuthCard;
