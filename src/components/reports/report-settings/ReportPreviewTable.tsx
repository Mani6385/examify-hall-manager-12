
import { SeatingArrangement } from "@/utils/reportUtils";

interface ReportPreviewTableProps {
  arrangements: SeatingArrangement[];
}

export function ReportPreviewTable({ arrangements }: ReportPreviewTableProps) {
  return (
    <div className="bg-muted/20 p-4 rounded-lg mt-2">
      <h3 className="text-sm font-semibold mb-2">Preview of Report Format</h3>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="p-2 text-left">S.No</th>
              <th className="p-2 text-left">Room No</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-left">Seats (Reg. Numbers)</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {arrangements.slice(0, 3).map((arr, index) => {
              // Group students by department with year information
              const deptGroups = new Map<string, {students: any[], year: string | null}>();
              arr.seating_assignments.forEach(assignment => {
                if (!assignment.department) return;
                
                // Find matching department config
                const deptConfig = arr.department_configs.find(
                  config => config.department === assignment.department
                );
                
                const key = assignment.department || 'Unassigned';
                const year = deptConfig?.year || null;
                
                if (!deptGroups.has(key)) {
                  deptGroups.set(key, {students: [], year});
                }
                deptGroups.get(key)?.students.push(assignment);
              });
              
              return (
                <tr key={arr.id} className="border-t">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-medium">{arr.room_no}</td>
                  <td className="p-2">
                    {Array.from(deptGroups.keys()).map(dept => (
                      <div key={dept} className="mb-1">{dept}</div>
                    ))}
                  </td>
                  <td className="p-2">
                    {Array.from(deptGroups.entries()).map(([dept, {year}]) => (
                      <div key={dept} className="mb-1 font-medium">{year || 'N/A'}</div>
                    ))}
                  </td>
                  <td className="p-2">
                    {Array.from(deptGroups.entries()).map(([dept, {students}]) => {
                      // Sort students by reg_no
                      students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
                      
                      // Get start and end reg numbers for this group
                      let regDisplay = "";
                      if (students.length > 0) {
                        const start = students[0].reg_no || '';
                        const end = students[students.length - 1].reg_no || '';
                        
                        if (start === end || students.length === 1) {
                          regDisplay = start;
                        } else {
                          regDisplay = `${start}-${end}`;
                        }
                      }
                      
                      return (
                        <div key={dept} className="mb-1 truncate max-w-[250px]">
                          {regDisplay}
                        </div>
                      );
                    })}
                  </td>
                  <td className="p-2 text-right font-medium">{arr.seating_assignments.length}</td>
                </tr>
              );
            })}
            {arrangements.length > 3 && (
              <tr className="border-t">
                <td colSpan={6} className="p-2 text-center text-muted-foreground">
                  + {arrangements.length - 3} more rooms
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground mt-2 text-right">
        PDF and Excel reports will include complete student lists with registration numbers, departments, and year information
      </div>
    </div>
  );
}
