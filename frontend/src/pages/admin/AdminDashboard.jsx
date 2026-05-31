import { useQuery } from '@tanstack/react-query';
import { BookOpen, ClipboardList, Users, UserPlus } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import { getAdminStatsAPI } from '../../api/user.api';

const AdminDashboard = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['adminStats'],
        queryFn: getAdminStatsAPI,
        staleTime: 30_000, // refresh every 30 seconds
    });

    const stats = data?.data?.stats ?? {
        totalStudents: 0,
        totalCourses: 0,
        pendingEnrollments: 0,
        staffMembers: 0,
    };

    return (
        <div className="p-6 flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">
                        Track platform activity and manage your academic operations.
                    </p>
                </div>
            </div>

            {isError && (
                <div className="text-sm text-destructive text-center py-4">
                    Failed to load stats. Please refresh the page.
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-card rounded-xl border border-border h-24 animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        icon={Users}
                        label="Total students"
                        value={stats.totalStudents}
                        accentBg="bg-primary/15"
                        accentText="text-primary"
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Total courses"
                        value={stats.totalCourses}
                        accentBg="bg-accent/20"
                        accentText="text-accent-foreground"
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Pending enrollments"
                        value={stats.pendingEnrollments}
                        accentBg="bg-secondary/70"
                        accentText="text-secondary-foreground"
                    />
                    <StatCard
                        icon={UserPlus}
                        label="Staff members"
                        value={stats.staffMembers}
                        accentBg="bg-muted"
                        accentText="text-foreground"
                    />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;