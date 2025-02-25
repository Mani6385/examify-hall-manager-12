
import { useState } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const Seating = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [rows, setRows] = useState("");
  const [columns, setColumns] = useState("");
  const { toast } = useToast();

  const handleCreatePlan = () => {
    if (!roomNumber || !rows || !columns) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically save the seating plan
    toast({
      title: "Success",
      description: "Seating plan created successfully",
    });
    
    setIsDialogOpen(false);
    // Reset form
    setRoomNumber("");
    setRows("");
    setColumns("");
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Seating Management</h1>
          <Button 
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setIsDialogOpen(true)}
          >
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Seating Plan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right">
                  Room No.
                </Label>
                <Input
                  id="room"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter room number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rows" className="text-right">
                  Rows
                </Label>
                <Input
                  id="rows"
                  type="number"
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                  className="col-span-3"
                  placeholder="Number of rows"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="columns" className="text-right">
                  Columns
                </Label>
                <Input
                  id="columns"
                  type="number"
                  value={columns}
                  onChange={(e) => setColumns(e.target.value)}
                  className="col-span-3"
                  placeholder="Number of columns"
                  min="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan} className="bg-rose-500 hover:bg-rose-600">
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Seating;
