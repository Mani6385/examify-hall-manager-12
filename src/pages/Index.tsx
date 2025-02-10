
import { Layout } from "@/components/dashboard/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, UserCog, BookOpen, CalendarDays, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        <div className="text-center p-8 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Exam Hall Management System
            </h2>
            <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-white/80 text-lg">
            Welcome to your comprehensive exam hall management dashboard
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value="1,234"
            icon={Users}
            description="Active enrollments"
            className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-blue-100"
          />
          <StatCard
            title="Teachers"
            value="56"
            icon={UserCog}
            description="Across all departments"
            className="bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-purple-100"
          />
          <StatCard
            title="Active Classes"
            value="24"
            icon={BookOpen}
            description="Currently in session"
            className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-green-100"
          />
          <StatCard
            title="Upcoming Exams"
            value="8"
            icon={CalendarDays}
            description="Next 7 days"
            className="bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-orange-100"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Overview</h3>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md">
              <p className="text-gray-600">
                Manage your exam hall arrangements efficiently with our comprehensive system.
                Keep track of students, teachers, and exam schedules all in one place.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/seating')}
                className="w-full p-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Create New Seating Plan
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="w-full p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
