import {
    getTeacherStatsAPI,
    getTeacherChartsAPI,
} from '../../api/user.api';
import TeacherCharts from '../../components/dashboard/TeacherCharts';
import { useQuery } from '@tanstack/react-query';


const TeacherDashboard = () => {
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

      if (isLoading) {
        return (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="h-14 w-72 bg-muted/20 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
              <div className="grid gap-4">
                <div className="h-24 bg-muted/20 rounded-xl border border-border animate-pulse" />
                <div className="h-24 bg-muted/20 rounded-xl border border-border animate-pulse" />
              </div>
              <div className="h-80 bg-muted/20 rounded-xl border border-border animate-pulse" />
            </div>
            <div className="h-85 bg-muted/20 rounded-xl border border-border animate-pulse" />
          </div>
        );
      }

      if (isError) {
        return (
          <div className="p-6 max-w-7xl mx-auto">
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              Failed to load teacher dashboard. Please refresh the page.
            </div>
          </div>
        );
      }

      return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your courses, students, and enrollment trends in one place.
            </p>
          </div>

          {chartsQuery.isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
                <div className="grid gap-4">
                  <div className="h-24 bg-muted/20 rounded-xl border border-border animate-pulse" />
                  <div className="h-24 bg-muted/20 rounded-xl border border-border animate-pulse" />
                </div>
                <div className="h-80 bg-muted/20 rounded-xl border border-border animate-pulse" />
              </div>
              <div className="h-85 bg-muted/20 rounded-xl border border-border animate-pulse" />
            </div>
          )}

          {chartsQuery.isError && (
            <p className="text-sm text-destructive text-center py-4">
              Failed to load charts. Please refresh the page.
            </p>
          )}

          {charts && <TeacherCharts stats={stats} charts={charts} />}
        </div>
      );
};

export default TeacherDashboard;
