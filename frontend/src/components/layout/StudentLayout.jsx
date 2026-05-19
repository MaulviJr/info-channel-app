import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import StudentTopbar from './StudentTopbar';

function StudentLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <StudentSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <StudentTopbar />
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default StudentLayout;
