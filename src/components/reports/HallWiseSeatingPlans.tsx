
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

  // Function to organize students by department
  const getStudentsByDepartment = (arrangement: SeatingArrangement) => {
    const departmentStudents = new Map<string, any[]>();
    
    arrangement.seating_assignments.forEach(assignment => {
      const dept = assignment.department || 'Unassigned';
      
      if (!departmentStudents.has(dept)) {
        departmentStudents.set(dept, []);
      }
      
      departmentStudents.get(dept)?.push(assignment);
    });
    
    return Array.from(departmentStudents.entries()).map(([dept, students]) => {
      students.sort((a, b) => a.seat_no.localeCompare(b.seat_no));
      return { department: dept, students };
    });
  };
  
  // Function to render a room table in the exact format shown in the image
  const renderRoomTable = (arrangement: SeatingArrangement) => {
    const departmentsData = getStudentsByDepartment(arrangement);
    const maxCols = 4; // Number of columns in the grid (from the image)
    
    return (
      <div className="border border-gray-300 w-full">
        <Table className="border-collapse">
          <TableBody>
            {departmentsData.map((deptData, deptIndex) => {
              // Organize students into rows of four
              const rows = [];
              for (let i = 0; i < deptData.students.length; i += maxCols) {
                rows.push(deptData.students.slice(i, i + maxCols));
              }
              
              return (
                <React.Fragment key={`dept-${deptData.department}`}>
                  {rows.map((rowStudents, rowIndex) => (
                    <TableRow key={`${deptData.department}-row-${rowIndex}`} className="border-b border-gray-300">
                      {/* Department name cell - only show in first row of each department */}
                      {rowIndex === 0 ? (
                        <TableCell 
                          className="border-r border-gray-300 font-medium p-3 align-top"
                          rowSpan={rows.length}
                        >
                          {deptData.department}
                        </TableCell>
                      ) : null}
                      
                      {/* Student cells */}
                      {rowStudents.map((student) => (
                        <TableCell key={`${student.seat_no}`} className="border-r border-gray-300 p-3">
                          {student.seat_no}: {student.reg_no || 'N/A'}
                        </TableCell>
                      ))}
                      
                      {/* Empty cells to fill the row */}
                      {Array.from({ length: maxCols - rowStudents.length }).map((_, i) => (
                        <TableCell key={`empty-${i}`} className="border-r border-gray-300 p-3">
                          &nbsp;
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Add a visual separator between departments except for the last department */}
                  {deptIndex < departmentsData.length - 1 && (
                    <TableRow className="h-0">
                      <TableCell colSpan={maxCols + 1} className="p-0 border-b-2 border-gray-300"></TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
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
