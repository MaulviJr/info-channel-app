import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { BookOpen, Users, TrendingUp, BarChart3 } from 'lucide-react';
import StatCard from './StatCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TeacherCharts = ({ stats, charts }) => {
  const [colors, setColors] = useState({
    primary: 'oklch(0.4823 0.1721 264.3)',
    primaryBg: 'oklch(0.4823 0.1721 264.3 / 0.2)',
    secondary: 'oklch(0.5934 0.1521 264.3)',
    border: 'oklch(0.8962 0.0151 277.8308)',
  });

  useEffect(() => {
    const updateColors = () => {
      const root = getComputedStyle(document.documentElement);
      const getVar = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
      const primary = getVar('--chart-1', 'oklch(0.4823 0.1721 264.3)');
      const secondary = getVar('--chart-4', 'oklch(0.5934 0.1521 264.3)');
      const border = getVar('--border', 'oklch(0.8962 0.0151 277.8308)');

      setColors({
        primary,
        primaryBg: primary.includes('oklch') ? primary.replace(')', ' / 0.2)') : 'rgba(41, 56, 144, 0.2)',
        secondary,
        border,
      });
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const statCards = [
    {
      label: 'My Courses',
      value: stats?.totalCourses?.toString() || '0',
      icon: BookOpen,
      accentText: 'text-blue-600',
      accentBg: 'bg-blue-100',
    },
    {
      label: 'My Students',
      value: stats?.totalStudents?.toString() || '0',
      icon: Users,
      accentText: 'text-emerald-600',
      accentBg: 'bg-emerald-100',
    },
  ];

  const studentsOverTime = charts?.studentsOverTime ?? [];
  const coursePopularity = charts?.coursePopularity ?? [];

  const studentsOverTimeData = {
    labels: studentsOverTime.map((item) => item.month),
    datasets: [
      {
        label: 'Students',
        data: studentsOverTime.map((item) => item.students),
        borderColor: colors.primary,
        backgroundColor: colors.primaryBg,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.primary,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const coursePopularityData = {
    labels: coursePopularity.map((item) => item.course),
    datasets: [
      {
        label: 'Enrollments',
        data: coursePopularity.map((item) => item.students),
        backgroundColor: colors.secondary,
        borderRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'currentColor' },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.border, drawBorder: false },
        ticks: { color: 'currentColor' },
      },
    },
  };

  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: colors.border, drawBorder: false },
        ticks: { color: 'currentColor' },
      },
      y: {
        grid: { display: false },
        ticks: { color: 'currentColor' },
      },
    },
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
        <div className="grid grid-cols-1 gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 h-full">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student activity</p>
              <h2 className="text-lg font-semibold text-foreground">Students over time</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-chart-1" />
              <span>Monthly trend</span>
            </div>
          </div>

          <div className="h-[320px]">
            {studentsOverTime.length > 0 ? (
              <Line data={studentsOverTimeData} options={lineOptions} />
            ) : (
              <div className="h-full rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                No student trend data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-chart-4" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Course popularity</p>
            <h2 className="text-lg font-semibold text-foreground">Enrollments in each course</h2>
          </div>
        </div>

        <div className="h-[280px]">
          {coursePopularity.length > 0 ? (
            <Bar data={coursePopularityData} options={horizontalBarOptions} />
          ) : (
            <div className="h-full rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
              No course popularity data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TeacherCharts.propTypes = {
  stats: PropTypes.shape({
    totalCourses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalStudents: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  charts: PropTypes.shape({
    studentsOverTime: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string,
      students: PropTypes.number,
    })),
    coursePopularity: PropTypes.arrayOf(PropTypes.shape({
      course: PropTypes.string,
      students: PropTypes.number,
    })),
  }),
};

TeacherCharts.defaultProps = {
  stats: {},
  charts: null,
};

export default TeacherCharts;
