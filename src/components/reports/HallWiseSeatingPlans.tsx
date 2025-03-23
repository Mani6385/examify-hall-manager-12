
import { SeatingArrangement, filterArrangementsByHall } from "@/utils/reportUtils";
import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HallWiseSeatingPlansProps {
  arrangements: SeatingArrangement[];
}

export function HallWiseSeatingPlans({ arrangements }: HallWiseSeatingPlansProps) {
  const [hallsWithArrangements, setHallsWithArrangements] = useState<Array<{ id: string; name: string; arrangements: SeatingArrangement[] }>>([]);

  useEffect(() => {
    // Identify unique hall IDs
    const hallIds = new Set<string>();
    
    arrangements.forEach(arrangement => {
      if (arrangement.hall_id) {
        hallIds.add(arrangement.hall_id);
      } else {
        const roomFirstDigit = arrangement.room_no.charAt(0);
        const mappedHallId = roomFirstDigit === '1' ? '1' : 
                             roomFirstDigit === '2' ? '2' : '3';
        hallIds.add(mappedHallId);
      }
    });
    
    // Create hall data with arrangements
    const hallsData = Array.from(hallIds).map(hallId => {
      const hallArrangements = filterArrangementsByHall(arrangements, hallId);
      return {
        id: hallId,
        name: hallArrangements.length > 0 && hallArrangements[0].hall_name 
              ? hallArrangements[0].hall_name 
              : `Hall ${hallId}`,
        arrangements: hallArrangements
      };
    });
    
    setHallsWithArrangements(hallsData);
  }, [arrangements]);

  const handlePrint = () => {
    window.print();
  };

  // Function to organize students by department for the grid format
  const getStudentsByDepartment = (arrangement: SeatingArrangement) => {
    // Create a map of department to students
    const departmentStudents = new Map<string, any[]>();
    
    arrangement.seating_assignments.forEach(assignment => {
      const dept = assignment.department || 'Unassigned';
      
      if (!departmentStudents.has(dept)) {
        departmentStudents.set(dept, []);
      }
      
      departmentStudents.get(dept)?.push(assignment);
    });
    
    // Convert map to array and sort students by seat_no
    return Array.from(departmentStudents.entries()).map(([dept, students]) => {
      students.sort((a, b) => a.seat_no.localeCompare(b.seat_no));
      return { department: dept, students };
    });
  };
  
  // Function to render a table in the format shown in the image
  const renderRoomTable = (arrangement: SeatingArrangement) => {
    const departmentsData = getStudentsByDepartment(arrangement);
    const maxCols = 4; // Number of columns in the grid (based on the image)
    
    return (
      <Table className="border-collapse border">
        <TableBody>
          {departmentsData.map((deptData) => {
            // Group students into rows of maxCols
            const rows = [];
            for (let i = 0; i < deptData.students.length; i += maxCols) {
              rows.push(deptData.students.slice(i, i + maxCols));
            }
            
            return (
              <>
                {/* Department row */}
                <TableRow key={`${deptData.department}-header`}>
                  <TableCell className="border p-2 bg-gray-50 font-medium">
                    {deptData.department}
                  </TableCell>
                  {rows[0]?.map((student, index) => (
                    <TableCell key={`${deptData.department}-header-${index}`} className="border p-2 bg-gray-50">
                      {student.seat_no}: {student.reg_no || 'N/A'}
                    </TableCell>
                  ))}
                  {/* Add empty cells if first row isn't full */}
                  {Array.from({ length: Math.max(0, maxCols - (rows[0]?.length || 0)) }).map((_, i) => (
                    <TableCell key={`${deptData.department}-empty-header-${i}`} className="border p-2 bg-gray-50"></TableCell>
                  ))}
                </TableRow>
                
                {/* Additional rows for this department (if any) */}
                {rows.slice(1).map((rowStudents, rowIndex) => (
                  <TableRow key={`${deptData.department}-row-${rowIndex + 1}`}>
                    <TableCell className="border p-2">
                      {/* Empty first cell for additional rows */}
                    </TableCell>
                    {rowStudents.map((student, studentIndex) => (
                      <TableCell key={`${deptData.department}-${rowIndex + 1}-${studentIndex}`} className="border p-2">
                        {student.seat_no}: {student.reg_no || 'N/A'}
                      </TableCell>
                    ))}
                    {/* Add empty cells if the row isn't full */}
                    {Array.from({ length: maxCols - rowStudents.length }).map((_, i) => (
                      <TableCell key={`${deptData.department}-${rowIndex + 1}-empty-${i}`} className="border p-2"></TableCell>
                    ))}
                  </TableRow>
                ))}
                
                {/* Add an empty row as separator between departments */}
                <TableRow className="h-2">
                  {Array.from({ length: maxCols + 1 }).map((_, i) => (
                    <TableCell key={`spacer-${deptData.department}-${i}`} className="p-0 border-0"></TableCell>
                  ))}
                </TableRow>
              </>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8 p-6 print:p-0">
      <div className="print:hidden flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hall-Wise Seating Plans</h1>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print Plans
        </Button>
      </div>
      
      {hallsWithArrangements.map(hall => (
        <div key={hall.id} className="break-after-page">
          <h2 className="text-xl font-bold mb-4 print:text-center">{hall.name} - Seating Plans</h2>
          
          {hall.arrangements.map(arrangement => (
            <Card key={arrangement.id} className="mb-8 overflow-hidden print:shadow-none print:border-0">
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="text-lg">
                  Room {arrangement.room_no} - Student Assignments by Department
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {renderRoomTable(arrangement)}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
