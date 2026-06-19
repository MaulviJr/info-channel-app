import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  BookOpen, 
  PlayCircle, 
  ArrowRight,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getMyEnrollmentsAPI } from '../../api/enrollment.api.js';
import Button from '../../components/common/Button';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const StudentProgress = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: getMyEnrollmentsAPI,
  });

  const enrollments = data?.data?.data?.enrollments || [];

  // --- Calculate Rich Statistics ---
  const stats = useMemo(() => {
    if (!enrollments.length) return null;

    const totalCourses = enrollments.length;
    let completedCourses = 0;
    let totalLecturesCompleted = 0;
    let totalProgressSum = 0;

    const chartDataRaw = [];

    enrollments.forEach(enrollment => {
      const progress = enrollment.progress || {};
      const percent = progress.percent || 0;
      
      if (percent === 100 || enrollment.status === 'completed') {
        completedCourses += 1;
      }
      
      totalLecturesCompleted += (progress.completedLectures || 0);
      totalProgressSum += percent;

      // Prepare raw data for the Bar Chart
      chartDataRaw.push({
        name: enrollment.course.title.length > 20 
          ? enrollment.course.title.substring(0, 20) + '...' 
          : enrollment.course.title,
        fullTitle: enrollment.course.title,
        progress: percent,
      });
    });

    return {
      totalCourses,
      completedCourses,
      totalLecturesCompleted,
      averageProgress: Math.round(totalProgressSum / totalCourses),
      chartDataRaw
    };
  }, [enrollments]);

  // Chart.js Configuration
  const chartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: stats.chartDataRaw.map((d) => d.name),
      datasets: [
        {
          label: 'Completion',
          data: stats.chartDataRaw.map((d) => d.progress),
          backgroundColor: stats.chartDataRaw.map((d) => 
            d.progress === 100 ? '#10b981' : '#3b82f6'
          ),
          borderRadius: 4,
          borderSkipped: false, // Ensures rounding applies nicely
        },
      ],
    };
  }, [stats]);

  const chartOptions = useMemo(() => {
    if (!stats) return {};
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
            }
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            callback: (value) => `${value}%`,
            font: {
              size: 12,
            }
          },
        },
      },
      plugins: {
        legend: {
          display: false, // Hide the legend to match previous UI
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#000',
          bodyColor: '#3b82f6',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (context) => {
              // Retrieve the full title using the data index
              const index = context[0].dataIndex;
              return stats.chartDataRaw[index].fullTitle;
            },
            label: (context) => {
              return `${context.raw}% Completed`;
            },
          },
        },
      },
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-2">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl"></div>)}
        </div>
        <div className="h-72 bg-muted rounded-xl mt-4"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Failed to load progress data.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!enrollments.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-card rounded-xl border border-border">
        <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Progress Yet</h2>
        <p className="text-muted-foreground mt-2 mb-6">Enroll in a course to start tracking your learning journey.</p>
        <Button onClick={() => navigate('/student/courses/browse')}>Browse Courses</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Learning Progress</h1>
        <p className="text-muted-foreground mt-1">Track your achievements and milestones across all courses.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Enrolled Courses</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="bg-green-500/10 p-3 rounded-lg text-green-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Completed Courses</p>
            <p className="text-2xl font-bold text-foreground">{stats.completedCourses}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="bg-blue-500/10 p-3 rounded-lg text-blue-600">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Lectures Watched</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalLecturesCompleted}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="bg-orange-500/10 p-3 rounded-lg text-orange-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Average Progress</p>
            <p className="text-2xl font-bold text-foreground">{stats.averageProgress}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6">Course Completion Rates</h2>
          <div className="h-72 w-full relative">
             <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Right Col: Detailed List */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-sm flex flex-col h-[400px]">
          <div className="p-6 border-b border-border shrink-0">
            <h2 className="text-lg font-bold text-foreground">Pick Up Where You Left Off</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {enrollments
              .sort((a, b) => (b.progress?.percent || 0) - (a.progress?.percent || 0)) // Sort highest progress first
              .map((enrollment) => {
              const progress = enrollment.progress || {};
              const percent = progress.percent || 0;
              const isCompleted = percent === 100;

              return (
                <div key={enrollment.id} className="p-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1 flex-1 pr-4" title={enrollment.course.title}>
                      {enrollment.course.title}
                    </h3>
                    <span className="text-xs font-bold text-primary">{percent}%</span>
                  </div>
                  
                  <div className="bg-muted rounded-full h-2 w-full mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {progress.completedLectures || 0} of {progress.totalLectures || 0} lectures
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-xs h-8 px-2 ${isCompleted ? 'text-green-600' : 'text-primary'}`}
                      onClick={() => navigate(`/student/courses/${enrollment.course_id}`)}
                    >
                      {isCompleted ? 'Review Course' : 'Continue'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentProgress;