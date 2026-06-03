import {
  getTeacherProfileAPI,
    updateTeacherProfileAPI,
    listTeacherCoursesAPI,
    listCourseStudentsAPI,
    getTeacherStatsAPI,
    getTeacherChartsAPI,
} from '../../api/user.api';
import StatCard from '../../components/dashboard/StatCard';
import TeacherCharts from '../../components/dashboard/TeacherCharts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js'
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// My courses card
// My Students Card
// Graph Showing Course Popularity by showing enrollments in it
// Another Graph Showing number of students over time.

// On Left side the stat cards will be available
// Right side will show the graph of students over time in form of line chart
// And below the card and line graph a horizontal bar graph showing enrollments of each student in the teachers course


const TeacherDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
        queryKey: ['teacherDashboardStats'],
        queryFn: getTeacherStatsAPI,
    });

    const chartsQuery = useQuery({
        queryKey: ['teacherCharts'],
        queryFn: getTeacherChartsAPI,
        staleTime: 60_000,
    });
    
      const stats = data?.data?.stats || {};
    const charts = chartsQuery.data?.data?.charts ?? null;
    console.log('TeacherDashboard stats:', stats);
    console.log('TeacherDashboard charts:', charts);
return(
  <div className="p-8 text-center text-gray-400 text-sm">TeacherDashboard - coming soon
  
     <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground w-full rounded-lg hover:bg-sidebar-accent/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
  </div>
  
)
};

export default TeacherDashboard;
