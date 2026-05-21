import React from 'react'; // Make sure to import React if needed in your setup
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from 'your-auth-context';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
     
    return (
        <div className="p-8 text-center text-gray-400 text-sm">
            AdminDashboard - coming soon
            <div>
                <button 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    // Added 'async' here to allow the use of 'await'
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}; 

export default AdminDashboard;