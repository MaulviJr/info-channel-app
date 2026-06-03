import React, { useState, useEffect } from 'react';
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
    ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { TrendingUp, DollarSign, BarChart2, PieChart, ChevronDown } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

const AdminCharts = ({ charts }) => {
    const [openCharts, setOpenCharts] = useState({
        enrollments: true,
        revenue: true,
        popularity: true,
        completion: true,
    });

    // Theme-aware colors state for ChartJS 
    const [colors, setColors] = useState({
        chart1: 'oklch(0.4823 0.1721 264.3)',
        chart1Bg: 'oklch(0.4823 0.1721 264.3 / 0.2)',
        chart2: 'oklch(0.8012 0.1732 91.2)',
        chart4: 'oklch(0.5934 0.1521 264.3)',
        muted: 'oklch(0.9566 0.0067 286.2732)',
        border: 'oklch(0.8962 0.0151 277.8308)',
    });

    useEffect(() => {
        // Read actual computed CSS variables so ChartJS syncs seamlessly with light/dark modes
        const updateColors = () => {
            const root = getComputedStyle(document.documentElement);
            const getVar = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
            
            const c1 = getVar('--chart-1', 'oklch(0.4823 0.1721 264.3)');
            const c2 = getVar('--chart-2', 'oklch(0.8012 0.1732 91.2)');
            const c4 = getVar('--chart-4', 'oklch(0.5934 0.1521 264.3)');
            const muted = getVar('--muted', 'oklch(0.9566 0.0067 286.2732)');
            const border = getVar('--border', 'oklch(0.8962 0.0151 277.8308)');

            setColors({
                chart1: c1,
                // Replace closing parenthesis to inject 20% alpha channel natively for OKLCH string
                chart1Bg: c1.includes('oklch') ? c1.replace(')', ' / 0.2)') : 'rgba(41, 56, 144, 0.2)',
                chart2: c2,
                chart4: c4,
                muted: muted,
                border: border,
            });
        };

        updateColors();
        
        // Ensure chart re-renders dynamically when user toggles 'dark' class on HTML
        const observer = new MutationObserver(updateColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const toggleChart = (key) => setOpenCharts(prev => ({ ...prev, [key]: !prev[key] }));

    const enrollmentsData = {
        labels: charts.enrollmentsByMonth.map(d => d.month),
        datasets: [
            {
                label: 'Enrollments',
                data: charts.enrollmentsByMonth.map(d => d.enrollments),
                borderColor: colors.chart1,
                backgroundColor: colors.chart1Bg,
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const revenueData = {
        labels: charts.revenueByMonth.map(d => d.month),
        datasets: [
            {
                label: 'Revenue (PKR)',
                data: charts.revenueByMonth.map(d => d.revenue),
                backgroundColor: colors.chart2,
                borderRadius: 4,
            }
        ]
    };

    const popularityData = {
        labels: charts.coursePopularity.map(d => d.course),
        datasets: [
            {
                label: 'Students',
                data: charts.coursePopularity.map(d => d.students),
                backgroundColor: colors.chart4,
                borderRadius: 4,
            }
        ]
    };

    const completionData = {
        labels: charts.profileCompletion.map(d => d.name),
        datasets: [
            {
                data: charts.profileCompletion.map(d => d.value),
                backgroundColor: [colors.chart1, colors.muted],
                borderWidth: 0,
            }
        ]
    };

    const completed = charts.profileCompletion.find(d => d.name === 'Complete')?.value || 0;
    const total = charts.profileCompletion.reduce((sum, d) => sum + d.value, 0);
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: colors.border, drawBorder: false }, beginAtZero: true }
        }
    };

    const horizontalBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: colors.border, drawBorder: false }, beginAtZero: true },
            y: { grid: { display: false } }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    };

    return (
        <div className="flex flex-col gap-4 mt-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                        onClick={() => toggleChart('enrollments')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-chart-1" />
                            <span className="text-sm font-medium text-foreground">Enrollments over time</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openCharts.enrollments ? 'rotate-180' : ''}`} />
                    </button>
                    {openCharts.enrollments && (
                        <div className="px-4 pb-4 h-[240px]">
                            <Line data={enrollmentsData} options={chartOptions} />
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                        onClick={() => toggleChart('revenue')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-chart-2" />
                            <span className="text-sm font-medium text-foreground">Revenue over time</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openCharts.revenue ? 'rotate-180' : ''}`} />
                    </button>
                    {openCharts.revenue && (
                        <div className="px-4 pb-4 h-[240px]">
                            <Bar 
                                data={revenueData} 
                                options={{
                                    ...chartOptions, 
                                    plugins: { 
                                        ...chartOptions.plugins, 
                                        tooltip: { 
                                            callbacks: { label: (context) => `PKR ${context.raw.toLocaleString()}` } 
                                        } 
                                    } 
                                }} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                        onClick={() => toggleChart('popularity')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-chart-4" />
                            <span className="text-sm font-medium text-foreground">Course popularity</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openCharts.popularity ? 'rotate-180' : ''}`} />
                    </button>
                    {openCharts.popularity && (
                        <div className="px-4 pb-4 h-[220px]">
                            <Bar data={popularityData} options={horizontalBarOptions} />
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                        onClick={() => toggleChart('completion')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Profile completion rate</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openCharts.completion ? 'rotate-180' : ''}`} />
                    </button>
                    {openCharts.completion && (
                        <div className="px-4 pb-4 h-[220px] flex flex-col items-center">
                            <div className="h-[160px] w-full">
                                <Pie data={completionData} options={pieOptions} />
                            </div>
                            <p className="text-center text-sm text-muted-foreground mt-4">
                                {completionPercent}% of students have complete profiles
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

AdminCharts.propTypes = {
    charts: PropTypes.shape({
        enrollmentsByMonth: PropTypes.arrayOf(PropTypes.shape({
            month: PropTypes.string,
            enrollments: PropTypes.number,
        })),
        revenueByMonth: PropTypes.arrayOf(PropTypes.shape({
            month: PropTypes.string,
            revenue: PropTypes.number,
        })),
        coursePopularity: PropTypes.arrayOf(PropTypes.shape({
            course: PropTypes.string,
            students: PropTypes.number,
        })),
        profileCompletion: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            value: PropTypes.number,
        })),
    }).isRequired,
};

export default AdminCharts;