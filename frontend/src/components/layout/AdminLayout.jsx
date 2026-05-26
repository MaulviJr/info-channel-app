import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => (
  <div className="flex h-screen overflow-hidden bg-background">
    <AdminSidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <AdminTopbar />
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AdminLayout;
