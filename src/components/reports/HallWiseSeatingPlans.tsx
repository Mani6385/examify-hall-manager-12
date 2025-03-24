
import React from "react";
import { SeatingArrangement, filterArrangementsByHall } from "@/utils/reportUtils";
import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HallWiseSeatingPlansProps {
  arrangements: SeatingArrangement[];
}

export function HallWiseSeatingPlans({ arrangements }: HallWiseSeatingPlansProps) {
  const [hallsWithArrangements, setHallsWithArrangements] = useState<Array<{ id: string; name: string; arrangements: SeatingArrangement[] }>>([]);

  useEffect(() => {
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

  const getStudentsByDepartment = (arrangement: SeatingArrangement) => {
    const departmentStudents = new Map<string, any[]>();
    
    arrangement.seating_assignments.forEach(assignment => {
      const dept = assignment.department || 'Unassigned';
      
      if (!departmentStudents.has(dept)) {
        departmentStudents.set(dept, []);
      }
      
      departmentStudents.get(dept)?.push(assignment);
    });
    
    return Array.from(departmentStudents.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dept, students]) => {
        students.sort((a, b) => {
          if (a.student_name && b.student_name) {
            return a.student_name.localeCompare(b.student_name);
          }
          return a.seat_no.localeCompare(b.seat_no);
        });
        return { department: dept, students };
      });
  };
  
  const renderRoomTable = (arrangement: SeatingArrangement) => {
    const departmentsData = getStudentsByDepartment(arrangement);
    
    return (
      <div className="w-full">
        <table className="w-full border-collapse">
          <tbody>
            {departmentsData.map((deptData) => {
              const rows = [];
              for (let i = 0; i < deptData.students.length; i += 4) {
                rows.push(deptData.students.slice(i, i + 4));
              }
              
              return (
                <React.Fragment key={`dept-${deptData.department}`}>
                  {rows.map((rowStudents, rowIndex) => (
                    <tr key={`${deptData.department}-row-${rowIndex}`}>
                      {rowIndex === 0 ? (
                        <td 
                          className="border border-gray-300 p-2 align-top font-medium"
                          rowSpan={rows.length}
                        >
                          {deptData.department}
                        </td>
                      ) : null}
                      
                      {rowStudents.map((student) => (
                        <td key={`${student.seat_no}`} className="border border-gray-300 p-2">
                          {student.seat_no}: {student.reg_no || (student.student_name ? student.student_name : 'N/A')}
                        </td>
                      ))}
                      
                      {/* Add empty cells to complete the row if needed */}
                      {Array.from({ length: 4 - rowStudents.length }).map((_, i) => (
                        <td key={`empty-${i}`} className="border border-gray-300 p-2">
                          &nbsp;
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
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
            <div key={arrangement.id} className="mb-8">
              <h3 className="text-lg font-semibold mb-3">
                Room {arrangement.room_no} - Student Assignments by Department
              </h3>
              {renderRoomTable(arrangement)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
