
import { Layout } from "@/components/dashboard/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, UserCog, BookOpen, CalendarDays } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Welcome to your exam hall management system
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value="1,234"
            icon={Users}
            description="Active enrollments"
          />
          <StatCard
            title="Teachers"
            value="56"
            icon={UserCog}
            description="Across all departments"
          />
          <StatCard
            title="Active Classes"
            value="24"
            icon={BookOpen}
            description="Currently in session"
          />
          <StatCard
            title="Upcoming Exams"
            value="8"
            icon={CalendarDays}
            description="Next 7 days"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-2">
            {/* Exam Schedule Component will go here */}
          </div>
          <div>
            {/* Quick Actions Component will go here */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
