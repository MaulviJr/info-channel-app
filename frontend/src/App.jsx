import PropTypes from 'prop-types';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

function AuthGate({ children }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight">Loading...</div>
          <p className="text-sm text-muted-foreground mt-2">Preparing your session</p>
        </div>
      </div>
    );
  }

  return children;
}

AuthGate.propTypes = {
  children: PropTypes.node.isRequired,
};

function App({ router }) {
  return (
    <AuthProvider>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </AuthProvider>
  );
}

App.propTypes = {
  router: PropTypes.object.isRequired,
};

export default App;
