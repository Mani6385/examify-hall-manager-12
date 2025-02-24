
import { Layout } from "@/components/dashboard/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, CalendarDays } from "lucide-react";

const Seating = () => {
  return (
    <Layout>
      <div className="min-h-screen -mt-16 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-100 to-teal-100 opacity-30" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-teal-500 mb-4">
            Exam Hall Seating System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your exam seating arrangements with our comprehensive management system
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-5xl px-4">
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-rose-500" />
              <h3 className="text-lg font-semibold mb-2">Student Management</h3>
              <p className="text-gray-600">Easily manage student records and seating preferences</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardContent className="p-6 text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-teal-500" />
              <h3 className="text-lg font-semibold mb-2">Exam Scheduling</h3>
              <p className="text-gray-600">Efficient exam scheduling and room allocation</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardContent className="p-6 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
              <p className="text-gray-600">Instant updates and notifications for changes</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-center mb-8">
          A comprehensive solution for managing exam hall seating arrangements
        </p>
      </div>
    </Layout>
  );
};

export default Seating;
