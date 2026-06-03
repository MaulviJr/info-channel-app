import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import TeacherTopbar from './TeacherTopbar';

function TeacherLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TeacherSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TeacherTopbar />
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default TeacherLayout;
