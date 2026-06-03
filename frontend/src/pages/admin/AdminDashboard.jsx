import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, GraduationCap, DollarSign } from 'lucide-react';
import { getAdminStatsAPI, getAdminChartsAPI } from '../../api/user.api';
import StatCard from '../../components/dashboard/StatCard';
import AdminCharts from '../../components/dashboard/AdminCharts';

const AdminDashboard = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: getAdminStatsAPI,
    });

    const chartsQuery = useQuery({
        queryKey: ['adminCharts'],
        queryFn: getAdminChartsAPI,
        staleTime: 60_000,
    });

    const stats = data?.data?.stats || {};
    const charts = chartsQuery.data?.data?.charts ?? null;
    console.log('AdminDashboard stats:', stats);
    console.log('AdminDashboard charts:', charts);
    if (isLoading) {
        return (
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl border border-border" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    Failed to load dashboard statistics. Please try again.
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: "Total Students",
            value: stats.totalStudents?.toString() || "0",
            icon: Users,
            accentText: "text-blue-600",
            accentBg: "bg-blue-100"
        },
        {
            label: "Pending Enrollments",
            value: stats.pendingEnrollments?.toString() || "0",
            icon: GraduationCap,
            accentText: "text-green-600",
            accentBg: "bg-green-100"
        },
        {
            label: "Total Courses",
            value: stats.totalCourses?.toString() || "0",
            icon: BookOpen,
            accentText: "text-purple-600",
            accentBg: "bg-purple-100"
        },
        {
            label: "Staff Members",
            value: stats.staffMembers?.toString() || "0",
            icon: Users, 
            accentText: "text-yellow-600",
            accentBg: "bg-yellow-100"
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here's what's happening at Info Channel Institute.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {chartsQuery.isLoading && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-card rounded-xl border border-border h-72 animate-pulse"
                        />
                    ))}
                </div>
            )}

            {chartsQuery.isError && (
                <p className="text-sm text-destructive text-center py-4 mt-4">
                    Failed to load charts. Please refresh the page.
                </p>
            )}

            {charts && <AdminCharts charts={charts} />}
        </div>
    );
};

export default AdminDashboard;