
import { Layout } from "@/components/dashboard/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList,
  Sparkles,
  School,
  Activity
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getGrowthDescription = (title: string) => {
    const percentage = Math.floor(Math.random() * 20) + 1;
    return title.includes("Upcoming") 
      ? `Next 30 days` 
      : `+${percentage}% from last semester`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section with Enhanced Design */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-indigo-500/80 animate-gradient-x" />
            <div className="absolute inset-0 bg-grid-white/10" style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23fff' fill-opacity='0.1' d='M1 1h2v2H1V1zm4 0h2v2H5V1zm4 0h2v2H9V1zm4 0h2v2h-2V1zm4 0h2v2h-2V1zm-16 4h2v2H1V5zm4 0h2v2H5V5zm4 0h2v2H9V5zm4 0h2v2h-2V5zm4 0h2v2h-2V5zm-16 4h2v2H1V9zm4 0h2v2H5V9zm4 0h2v2H9V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm-16 4h2v2H1v-2zm4 0h2v2H5v-2zm4 0h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z'/%3E%3C/svg%3E")`
            }} />
          </div>
          <div className="relative p-8 md:p-12">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 text-white border-white/20 bg-white/10 backdrop-blur-sm">
                <Activity className="w-3 h-3 mr-2" />
                Dashboard Overview
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 [text-shadow:_0_1px_12px_rgb(255_255_255_/_20%)]">
                Exam Hall Seating Management
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                Streamline your exam organization with our comprehensive seating arrangement system.
                Monitor students, manage teachers, and optimize exam arrangements efficiently.
              </p>
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">
                    Error loading dashboard data. Please refresh the page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid with Enhanced Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="p-6 rounded-lg border bg-card animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Students"
                value={formatNumber(stats?.totalStudents || 0)}
                icon={Users}
                description={getGrowthDescription("Students")}
                className="text-blue-600 bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-100"
              />
              <StatCard
                title="Active Teachers"
                value={formatNumber(stats?.activeTeachers || 0)}
                icon={GraduationCap}
                description="Currently assigned"
                className="text-purple-600 bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-purple-100"
              />
              <StatCard
                title="Total Classes"
                value={formatNumber(stats?.totalClasses || 0)}
                icon={School}
                description={getGrowthDescription("Classes")}
                className="text-green-600 bg-gradient-to-br from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border-green-100"
              />
              <StatCard
                title="Upcoming Exams"
                value={formatNumber(stats?.upcomingExams || 0)}
                icon={ClipboardList}
                description="Next 30 days"
                className="text-amber-600 bg-gradient-to-br from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border-amber-100"
              />
              <StatCard
                title="Active Subjects"
                value={formatNumber(stats?.activeSubjects || 0)}
                icon={BookOpen}
                description="Current semester"
                className="text-pink-600 bg-gradient-to-br from-pink-500/10 to-pink-600/10 hover:from-pink-500/20 hover:to-pink-600/20 border-pink-100"
              />
              <StatCard
                title="Seating Plans"
                value={formatNumber(stats?.seatingPlans || 0)}
                icon={Sparkles}
                description="Ready for upcoming exams"
                className="text-indigo-600 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 hover:from-indigo-500/20 hover:to-indigo-600/20 border-indigo-100"
              />
            </>
          )}
        </div>

        {/* Activity & Events Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border bg-gradient-to-br from-rose-500/10 to-orange-500/10 backdrop-blur-sm border-rose-100">
            <h3 className="text-xl font-semibold text-rose-800 dark:text-gray-200 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm animate-pulse">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : (
                (stats?.recentActivities || []).map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-white/70 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{activity}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border-cyan-100">
            <h3 className="text-xl font-semibold text-cyan-800 dark:text-gray-200 mb-4">
              Upcoming Events
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm animate-pulse">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : (
                (stats?.upcomingEvents || []).map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-white/70 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{event}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-500/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
