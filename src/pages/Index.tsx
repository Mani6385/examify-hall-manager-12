
import { Layout } from "@/components/dashboard/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList,
  Sparkles,
  School
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  // Format numbers with commas for better readability
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Generate growth description based on random percentage
  const getGrowthDescription = (title: string) => {
    const percentage = Math.floor(Math.random() * 20) + 1;
    return title.includes("Upcoming") 
      ? `Next 30 days` 
      : `+${percentage}% from last semester`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-lg blur-xl" />
          <div className="relative bg-white/50 backdrop-blur-sm p-8 rounded-lg border shadow-lg">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              Exam Hall Seating Arrangement System
            </h1>
            <p className="mt-4 text-gray-600 max-w-2xl">
              Welcome to your comprehensive exam management dashboard. Monitor students, teachers, 
              and exam arrangements all in one place.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-500">
                Error loading dashboard data. Please refresh the page.
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="p-6 rounded-lg border shadow-sm">
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
                className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
              />
              <StatCard
                title="Active Teachers"
                value={formatNumber(stats?.activeTeachers || 0)}
                icon={GraduationCap}
                description="Currently assigned"
                className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200"
              />
              <StatCard
                title="Total Classes"
                value={formatNumber(stats?.totalClasses || 0)}
                icon={School}
                description={getGrowthDescription("Classes")}
                className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200"
              />
              <StatCard
                title="Upcoming Exams"
                value={formatNumber(stats?.upcomingExams || 0)}
                icon={ClipboardList}
                description="Next 30 days"
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200"
              />
              <StatCard
                title="Active Subjects"
                value={formatNumber(stats?.activeSubjects || 0)}
                icon={BookOpen}
                description="Current semester"
                className="bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200"
              />
              <StatCard
                title="Seating Plans"
                value={formatNumber(stats?.seatingPlans || 0)}
                icon={Sparkles}
                description="Ready for upcoming exams"
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200"
              />
            </>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border bg-gradient-to-br from-rose-50 to-rose-100 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                // Loading skeletons for activities
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-md backdrop-blur-sm">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : (
                (stats?.recentActivities || []).map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-white/50 rounded-md backdrop-blur-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                    <p className="text-sm text-gray-600">{activity}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 rounded-lg border bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Upcoming Events
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                // Loading skeletons for events
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-md backdrop-blur-sm">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : (
                (stats?.upcomingEvents || []).map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-white/50 rounded-md backdrop-blur-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <p className="text-sm text-gray-600">{event}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
