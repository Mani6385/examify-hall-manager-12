
import { useState } from 'react';
import { SeatingArrangement } from '@/utils/reportUtils';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Grid, AlertCircle } from "lucide-react";

interface SeatingGridPreviewProps {
  arrangement: SeatingArrangement;
}

export function SeatingGridPreview({ arrangement }: SeatingGridPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Map of seat assignments for quick lookup
  const assignmentMap = new Map();
  arrangement.seating_assignments.forEach(assignment => {
    if (assignment.seat_no && assignment.seat_no.trim() !== '') {
      assignmentMap.set(assignment.seat_no, assignment);
    }
  });

  // Get department color
  const getDepartmentColor = (department: string) => {
    if (!department) return 'bg-gray-200';
    const index = arrangement.department_configs.findIndex(d => d.department === department);
    if (index === -1) return 'bg-gray-200';
    
    switch (index % 6) {
      case 0: return 'bg-blue-200 border-blue-400';
      case 1: return 'bg-green-200 border-green-400';
      case 2: return 'bg-yellow-200 border-yellow-400';
      case 3: return 'bg-purple-200 border-purple-400';
      case 4: return 'bg-pink-200 border-pink-400';
      case 5: return 'bg-orange-200 border-orange-400';
      default: return 'bg-gray-200';
    }
  };

  // Group students by department for more organized display
  const departmentGroups = new Map<string, any[]>();
  arrangement.seating_assignments.forEach(assignment => {
    const dept = assignment.department || 'Unassigned';
    if (!departmentGroups.has(dept)) {
      departmentGroups.set(dept, []);
    }
    departmentGroups.get(dept)?.push(assignment);
  });

  if (!arrangement || arrangement.seating_assignments.length === 0) {
    return (
      <Button variant="outline" size="sm" className="flex items-center gap-1" disabled>
        <Grid className="h-4 w-4" />
        Grid View
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Grid className="h-4 w-4" />
          Grid View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogTitle>Room {arrangement.room_no} - Seating Grid</DialogTitle>
        
        <div className="space-y-4 p-4">
          {arrangement.seating_assignments.length > 0 ? (
            <>
              {/* Color legend */}
              <div className="flex flex-wrap gap-3 mb-2">
                {Array.from(departmentGroups.keys()).map((dept, i) => (
                  <div key={dept} className="flex items-center">
                    <div className={`w-3 h-3 mr-1 ${getDepartmentColor(dept)}`}></div>
                    <span className="text-xs">{dept}</span>
                  </div>
                ))}
              </div>
              
              <div 
                className="grid gap-1 border rounded-lg p-4 overflow-auto" 
                style={{ 
                  gridTemplateColumns: `repeat(${arrangement.columns}, minmax(80px, 1fr))`,
                  minWidth: arrangement.columns * 80,
                }}
              >
                {Array.from({ length: arrangement.rows * arrangement.columns }).map((_, index) => {
                  const row = Math.floor(index / arrangement.columns);
                  const col = index % arrangement.columns;
                  
                  // Calculate seat number
                  const rowLabel = String.fromCharCode(65 + row); // A, B, C, ...
                  const colLabel = col + 1;
                  const seatNo = `${rowLabel}${colLabel}`;
                  
                  // Get assignment for this seat
                  const assignment = assignmentMap.get(seatNo);
                  
                  return (
                    <div 
                      key={seatNo} 
                      className={`border rounded-md p-2 text-center ${assignment ? getDepartmentColor(assignment.department) : 'bg-gray-50'}`}
                    >
                      <div className="text-xs font-bold">{seatNo}</div>
                      {assignment && (
                        <>
                          <div className="text-xs truncate">{assignment.student_name || ''}</div>
                          <div className="text-xs text-gray-500">{assignment.reg_no || ''}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Department-wise student list */}
              <div className="mt-6 border rounded-lg p-4">
                <h3 className="text-sm font-bold mb-2">Student Distribution by Department</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from(departmentGroups.entries()).map(([dept, students]) => (
                    <div key={dept} className="border rounded p-2">
                      <div className="font-medium text-sm bg-muted p-1">{dept} ({students.length})</div>
                      <div className="text-xs mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {students.map(student => (
                          <div key={student.reg_no} className="flex justify-between">
                            <span>{student.reg_no}</span>
                            <span className="text-muted-foreground">{student.seat_no}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No seating assignments found</h3>
              <p className="text-gray-500 text-center">
                There are no seating assignments for this room yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
