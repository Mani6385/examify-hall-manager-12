
import { SeatingArrangement, filterArrangementsByHall, getDepartmentsWithYears } from "@/utils/reportUtils";
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

  // Function to organize students by department and create table rows
  const getStudentsByDepartment = (arrangement: SeatingArrangement) => {
    // Group students by department
    const deptMap = new Map<string, any[]>();
    
    arrangement.seating_assignments.forEach(assignment => {
      const dept = assignment.department || 'Unassigned';
      
      if (!deptMap.has(dept)) {
        deptMap.set(dept, []);
      }
      
      deptMap.get(dept)?.push(assignment);
    });
    
    // Transform map to array of departments with students
    return Array.from(deptMap.entries()).map(([dept, students]) => {
      // Sort students by seat_no to ensure consistent ordering
      students.sort((a, b) => a.seat_no.localeCompare(b.seat_no));
      
      return {
        department: dept,
        students
      };
    });
  };
  
  // Function to create a table with students organized by department
  const renderDepartmentTable = (arrangement: SeatingArrangement) => {
    const departmentData = getStudentsByDepartment(arrangement);
    const maxCols = 4; // Number of columns in the table (based on the image)
    
    return (
      <Table className="border-collapse border">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/5 border p-2 font-bold">Department</TableHead>
            <TableHead colSpan={maxCols} className="border p-2 font-bold">Student Assignments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departmentData.map((dept, index) => {
            // Create chunks of students for each row
            const rows = [];
            const students = dept.students;
            
            for (let i = 0; i < students.length; i += maxCols) {
              const rowStudents = students.slice(i, i + maxCols);
              rows.push(rowStudents);
            }
            
            return rows.map((rowStudents, rowIndex) => (
              <TableRow key={`${dept.department}-${rowIndex}`}>
                {rowIndex === 0 ? (
                  <TableCell rowSpan={rows.length} className="border p-2 align-top font-medium">
                    {dept.department}
                  </TableCell>
                ) : null}
                
                {rowStudents.map((student, cellIndex) => (
                  <TableCell key={student.id} className="border p-2">
                    {student.seat_no}: {student.reg_no || 'N/A'}
                  </TableCell>
                ))}
                
                {/* Add empty cells if the row isn't full */}
                {Array.from({ length: maxCols - rowStudents.length }).map((_, i) => (
                  <TableCell key={`empty-${i}`} className="border p-2"></TableCell>
                ))}
              </TableRow>
            ));
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
                {renderDepartmentTable(arrangement)}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
