import { useAuth } from '../../hooks/useAuth';

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';

function TeacherTopbar() {
  const { user } = useAuth();
  const initials = getInitials(user?.name);

  return (
    <div className="h-14 px-6 flex items-center justify-between bg-card border-b border-border">
      <div className="text-base font-medium text-foreground">Dashboard</div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
          {initials}
        </div>
        <div className="text-sm text-muted-foreground">{user?.name || 'Teacher'}</div>
      </div>
    </div>
  );
}

export default TeacherTopbar;
