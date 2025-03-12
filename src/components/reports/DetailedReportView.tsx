
import { useState } from "react";
import { SeatingArrangement } from "@/utils/reportUtils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailedReportViewProps {
  arrangement: SeatingArrangement;
}

export function DetailedReportView({ arrangement }: DetailedReportViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Group assignments by department for easy overview
  const departmentGroups = arrangement.seating_assignments.reduce((acc: Record<string, any[]>, item) => {
    const dept = item.department || 'Unassigned';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(item);
    return acc;
  }, {});

  // Function to sort seat numbers in proper alphanumeric order (A1, B1, A2, B2, etc.)
  const sortSeatNumbers = (a: string, b: string) => {
    // Extract the prefix and number
    const aPrefix = a.charAt(0);
    const bPrefix = b.charAt(0);
    
    // Extract numeric part
    const aNum = parseInt(a.substring(1));
    const bNum = parseInt(b.substring(1));
    
    // First sort by number
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    
    // Then sort by prefix
    return aPrefix.localeCompare(bPrefix);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Room {arrangement.room_no} (Floor {arrangement.floor_no}) - Seating Arrangement
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Student List</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Room Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Room {arrangement.room_no}</div>
                  <p className="text-xs text-muted-foreground">Floor {arrangement.floor_no}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{arrangement.rows} × {arrangement.columns}</div>
                  <p className="text-xs text-muted-foreground">
                    {arrangement.rows * arrangement.columns} total seats
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{arrangement.seating_assignments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((arrangement.seating_assignments.length / (arrangement.rows * arrangement.columns)) * 100)}% filled
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(departmentGroups).map(([dept, students]) => (
                    <Badge key={dept} variant="outline" className="px-3 py-1">
                      {dept}: {students.length} students
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Student Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seat No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Registration No</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrangement.seating_assignments.length > 0 ? (
                      arrangement.seating_assignments
                        .sort((a, b) => sortSeatNumbers(a.seat_no, b.seat_no))
                        .map((assignment, index) => (
                          <TableRow key={`seat-${index}-${assignment.seat_no}`}>
                            <TableCell className="font-medium">{assignment.seat_no}</TableCell>
                            <TableCell>{assignment.student_name || 'N/A'}</TableCell>
                            <TableCell>{assignment.reg_no || 'N/A'}</TableCell>
                            <TableCell>{assignment.department || 'N/A'}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No students assigned to this room
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
