import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import getDashboardByRole from '../utils/getDashboardByRole';

const LoadingSpinner = () => (
	<div className="min-h-screen flex items-center justify-center">
		<div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
	</div>
);

const GuestRoute = () => {
	const { isAuthenticated, isLoading, user } = useContext(AuthContext);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (isAuthenticated) {
		return <Navigate to={getDashboardByRole(user?.role)} replace />;
	}

	return <Outlet />;
};

export default GuestRoute;
