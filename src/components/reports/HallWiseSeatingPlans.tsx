
import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SeatingArrangement, formatDepartmentsWithYears } from "@/utils/reportUtils";
import { getPrintableId } from '@/utils/hallUtils';
import { Building, Grid2X2, Map, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SeatingGridPreview } from "./SeatingGridPreview";
import { DetailedReportView } from "./DetailedReportView";

interface HallWiseSeatingPlansProps {
  arrangements: SeatingArrangement[];
}

export function HallWiseSeatingPlans({ arrangements }: HallWiseSeatingPlansProps) {
  const printableId = useRef(getPrintableId());

  // Group arrangements by hall
  const hallGroups = arrangements.reduce((acc, arrangement) => {
    // Get the hall ID either from arrangement.hall_id or derive it from room number
    const hallId = arrangement.hall_id || (() => {
      const roomFirstDigit = arrangement.room_no.charAt(0);
      return roomFirstDigit === '1' ? '1' : 
             roomFirstDigit === '2' ? '2' : '3';
    })();
    
    const hallName = arrangement.hall_name || (() => {
      const roomFirstDigit = arrangement.room_no.charAt(0);
      const mappedHallId = roomFirstDigit === '1' ? '1' : 
                           roomFirstDigit === '2' ? '2' : '3';
      return `Hall ${mappedHallId}`;
    })();
    
    if (!acc[hallId]) {
      acc[hallId] = { name: hallName, arrangements: [] };
    }
    
    acc[hallId].arrangements.push(arrangement);
    return acc;
  }, {} as Record<string, { name: string, arrangements: SeatingArrangement[] }>);

  return (
    <div id={printableId.current} className="space-y-12 print:space-y-0">
      {Object.entries(hallGroups).map(([hallId, { name, arrangements }], index) => {
        const totalStudents = arrangements.reduce(
          (sum, arr) => sum + arr.seating_assignments.length, 0
        );
        
        // Get unique departments
        const departments = new Set<string>();
        arrangements.forEach(arrangement => {
          arrangement.department_configs.forEach(config => {
            if (config.department) departments.add(config.department);
          });
        });
        
        // Group arrangements by department and year using the utility function
        const groupedArrangements = arrangements.reduce((acc, arrangement) => {
          return {
            ...acc,
            [arrangement.id]: formatDepartmentsWithYears(arrangement)
          };
        }, {} as Record<string, string>);

        return (
          <div key={hallId} className={`print:pb-8 ${index > 0 ? 'print:page-break-before' : ''}`}>
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-6 w-6 mr-2 text-slate-700" />
                    <CardTitle className="text-2xl">{name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="flex gap-6 mt-2">
                  <div className="flex items-center">
                    <Map className="h-4 w-4 mr-1 text-slate-500" />
                    <span>{arrangements.length} {arrangements.length === 1 ? 'Room' : 'Rooms'}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-slate-500" />
                    <span>{totalStudents} Students</span>
                  </div>
                  <div className="flex items-center">
                    <Grid2X2 className="h-4 w-4 mr-1 text-slate-500" />
                    <span>{departments.size} {departments.size === 1 ? 'Department' : 'Departments'}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Departments & Years</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead className="print:hidden">Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrangements.map((arrangement) => (
                      <TableRow key={arrangement.id}>
                        <TableCell className="font-medium">{arrangement.room_no}</TableCell>
                        <TableCell>{arrangement.floor_no}</TableCell>
                        <TableCell>{arrangement.rows} × {arrangement.columns}</TableCell>
                        <TableCell className="max-w-xs truncate" title={groupedArrangements[arrangement.id]}>
                          {groupedArrangements[arrangement.id]}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-800">
                            {arrangement.seating_assignments.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="print:hidden">
                          <div className="flex space-x-2">
                            <SeatingGridPreview arrangement={arrangement} />
                            <DetailedReportView arrangement={arrangement} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Add department-wise breakdown */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(departments).map(department => {
                // Count students by department for this hall
                const deptStudents = arrangements.reduce((count, arrangement) => {
                  const deptAssignments = arrangement.seating_assignments.filter(
                    a => a.department === department
                  );
                  return count + deptAssignments.length;
                }, 0);
                
                // Find all rooms with this department
                const deptRooms = arrangements.filter(arrangement => 
                  arrangement.seating_assignments.some(a => a.department === department)
                ).map(a => a.room_no);
                
                return (
                  <Card key={department} className="shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-md">{department}</CardTitle>
                      <CardDescription>
                        {deptStudents} students in {deptRooms.length} {deptRooms.length === 1 ? 'room' : 'rooms'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-sm">
                        Rooms: {deptRooms.join(', ')}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
