function StatCard({ icon: Icon, label, value, accentBg, accentText }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`p-2 rounded-lg ${accentBg}`}>
          <Icon className={`w-4 h-4 ${accentText}`} />
        </div>
      </div>
      <div className="text-3xl font-semibold text-foreground mt-3">{value}</div>
    </div>
  );
}

export default StatCard;
