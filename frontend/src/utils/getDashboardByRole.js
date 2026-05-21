const getDashboardByRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    default:
      return '/student/dashboard';
  }
};

export default getDashboardByRole;
