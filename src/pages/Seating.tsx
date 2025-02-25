
import { Layout } from "@/components/dashboard/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const Seating = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Seating Management</h1>
          <Button className="bg-rose-500 hover:bg-rose-600">
            Create New Seating Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-rose-500" />
                <div>
                  <h3 className="text-lg font-semibold">Total Students</h3>
                  <p className="text-3xl font-bold">150</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <GraduationCap className="w-8 h-8 text-teal-500" />
                <div>
                  <h3 className="text-lg font-semibold">Active Exams</h3>
                  <p className="text-3xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CalendarDays className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className="text-lg font-semibold">Upcoming Plans</h3>
                  <p className="text-3xl font-bold">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Seating Plans</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((plan) => (
                <div key={plan} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Exam Hall {plan}</h3>
                    <p className="text-sm text-gray-600">50 students • Room 101</p>
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Seating;
