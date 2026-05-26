import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

const getTitleFromPath = (pathname) => {
  if (!pathname || pathname === '/admin') {
    return 'Dashboard';
  }

  if (pathname.startsWith('/admin/students')) {
    return 'Students';
  }

  if (pathname.startsWith('/admin/courses')) {
    return 'Courses';
  }

  if (pathname.startsWith('/admin/enrollments')) {
    return 'Enrollments';
  }

  if (pathname.startsWith('/admin/users/new')) {
    return 'Create Staff';
  }

  return 'Admin';
};

function AdminTopbar() {
  const { user } = useAuth();
  const location = useLocation();
  const initials = getInitials(user?.name);
  const title = getTitleFromPath(location.pathname);

  return (
    <div className="h-14 px-6 flex items-center justify-between bg-card border-b border-border">
      <div className="text-base font-medium text-foreground">{title}</div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
          {initials}
        </div>
        <div className="text-sm text-muted-foreground">{user?.name || 'Admin'}</div>
      </div>
    </div>
  );
}

export default AdminTopbar;
