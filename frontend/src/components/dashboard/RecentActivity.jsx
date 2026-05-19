function RecentActivity() {
  return (
    <div>
      <div className="text-base font-medium text-foreground mb-3">Recent Activity</div>
      <div className="bg-card rounded-xl border border-border p-5">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="w-48 h-3 bg-muted rounded animate-pulse" />
              <div className="w-32 h-2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
        <div className="text-xs text-center text-muted-foreground mt-3">
          Detailed activity tracking coming soon
        </div>
      </div>
    </div>
  );
}

export default RecentActivity;
