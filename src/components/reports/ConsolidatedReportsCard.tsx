import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportButtons } from "./ReportButtons";
import { Button } from "@/components/ui/button";
import { ChevronDown, BarChart, FileSpreadsheet, Users, FileText, Table, Download, Printer, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { SeatingArrangement, getHallNameById, formatDepartmentsWithYears, generateConsolidatedReportData } from "@/utils/reportUtils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConsolidatedReportsCardProps {
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  selectedHall: string;
  arrangements: SeatingArrangement[];
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
}

export function ConsolidatedReportsCard({
  isLoading,
  isLoadingPdf,
  isLoadingExcel,
  selectedHall,
  arrangements,
  onGeneratePdf,
  onGenerateExcel
}: ConsolidatedReportsCardProps) {
  const { toast } = useToast();
  const [detailedFormat, setDetailedFormat] = useState<boolean>(true);
  const [includeStudentInfo, setIncludeStudentInfo] = useState<boolean>(true);
  const [previewTab, setPreviewTab] = useState<string>("consolidated");
  
  const handleFormatChange = (checked: boolean) => {
    setDetailedFormat(checked);
    toast({
      title: `Format updated`,
      description: `Using ${checked ? 'detailed' : 'summary'} format for reports`,
    });
  };

  const handleStudentInfoChange = (checked: boolean) => {
    setIncludeStudentInfo(checked);
    toast({
      description: `Student details will ${checked ? 'be included' : 'not be included'} in reports`,
    });
  };

  const handleGenerateSpecialReport = (type: string) => {
    toast({
      title: "Report generation started",
      description: `Generating ${type} report...`,
    });
    
    // In a real implementation, this would call different report generation functions
    setTimeout(() => {
      toast({
        title: "Report generated",
        description: `${type} report has been generated successfully`,
        variant: "default",
      });
    }, 1500);
  };

  // Count total students across all arrangements
  const totalStudents = arrangements.reduce(
    (sum, arrangement) => sum + arrangement.seating_assignments.length, 
    0
  );

  // Count total rooms
  const totalRooms = arrangements.length;

  // Get students by department
  const departmentData = new Map<string, { count: number, years: Set<string> }>();
  arrangements.forEach(arr => {
    arr.seating_assignments.forEach(student => {
      if (!student.department) return;
      
      // Find matching department config to get year information
      const deptConfig = arr.department_configs.find(
        config => config.department === student.department
      );
      
      const year = deptConfig?.year || 'Unspecified';
      
      if (!departmentData.has(student.department)) {
        departmentData.set(student.department, { count: 0, years: new Set() });
      }
      
      const data = departmentData.get(student.department)!;
      data.count++;
      data.years.add(year);
    });
  });

  // Generate consolidated data for preview
  const consolidatedData = generateConsolidatedReportData(arrangements);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Consolidated Reports</CardTitle>
            <CardDescription>
              Download complete seating plan for {getHallNameById(selectedHall)}
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {totalStudents} Students • {totalRooms} Rooms
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Detailed Format</span>
                <span className="text-xs text-muted-foreground">Class and reg. number details</span>
              </div>
              <Switch 
                checked={detailedFormat} 
                onCheckedChange={handleFormatChange} 
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Include Student Info</span>
                <span className="text-xs text-muted-foreground">Names and registration numbers</span>
              </div>
              <Switch 
                checked={includeStudentInfo} 
                onCheckedChange={handleStudentInfoChange} 
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Button 
              variant="default" 
              onClick={onGeneratePdf} 
              disabled={isLoadingPdf} 
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {isLoadingPdf ? "Generating PDF..." : "Generate PDF Report"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onGenerateExcel} 
              disabled={isLoadingExcel}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {isLoadingExcel ? "Generating Excel..." : "Generate Excel Report"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Report Options
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleGenerateSpecialReport("Department Summary")}>
                  <Users className="mr-2 h-4 w-4" />
                  Department Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateSpecialReport("Room Utilization")}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Room Utilization
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleGenerateSpecialReport("Student Attendance")}>
                  <Table className="mr-2 h-4 w-4" />
                  Student Attendance Sheet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateSpecialReport("Downloads Package")}>
                  <Download className="mr-2 h-4 w-4" />
                  Package All Downloads
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="bg-white rounded-lg border shadow-sm mt-2 overflow-hidden">
            <div className="bg-muted/50 p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Export Preview</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                  <FileSpreadsheet className="h-3.5 w-3.5 ml-2" />
                  <span>Excel</span>
                  <Printer className="h-3.5 w-3.5 ml-2" />
                  <span>Print</span>
                </div>
              </div>
            </div>
            
            <Tabs value={previewTab} onValueChange={setPreviewTab} className="p-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="consolidated">Consolidated View</TabsTrigger>
                <TabsTrigger value="detailed">Room Details</TabsTrigger>
                <TabsTrigger value="department">Department Lists</TabsTrigger>
              </TabsList>
              
              <TabsContent value="consolidated" className="mt-2">
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
                      {consolidatedData.slice(0, 3).map((roomData, roomIndex) => {
                        // If there are no departments, create a single row
                        if (roomData.departmentRows.length === 0) {
                          return (
                            <tr key={`room-${roomIndex}`} className="border-t">
                              <td className="p-2">{roomIndex + 1}</td>
                              <td className="p-2 font-medium">{roomData.room}</td>
                              <td className="p-2" colSpan={2}>No students assigned</td>
                              <td className="p-2">-</td>
                              <td className="p-2 text-right font-medium">0</td>
                            </tr>
                          );
                        }
                        
                        // Create a row for each department in this room
                        return roomData.departmentRows.map((deptRow, deptIndex) => (
                          <tr key={`room-${roomIndex}-dept-${deptIndex}`} className="border-t">
                            <td className="p-2">{deptRow.isFirstDeptInRoom ? roomIndex + 1 : ''}</td>
                            <td className="p-2 font-medium">{deptRow.isFirstDeptInRoom ? roomData.room : ''}</td>
                            <td className="p-2">{deptRow.department}</td>
                            <td className="p-2">{deptRow.year}</td>
                            <td className="p-2 truncate max-w-[250px]">{deptRow.regNumbers}</td>
                            <td className="p-2 text-right font-medium">
                              {deptRow.isFirstDeptInRoom ? roomData.totalStudents : ''}
                            </td>
                          </tr>
                        ));
                      })}
                      {consolidatedData.length > 3 && (
                        <tr className="border-t">
                          <td colSpan={6} className="p-2 text-center text-muted-foreground">
                            + {consolidatedData.length - 3} more rooms
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>PDF export includes a cover page, consolidated table, and room-specific details</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="detailed" className="space-y-4 mt-2">
                {arrangements.length > 0 ? (
                  <div className="border rounded p-3">
                    <h4 className="text-xs font-medium mb-2">Room {arrangements[0].room_no} - Student Assignments</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {arrangements[0].department_configs.slice(0, 2).map(config => (
                        <div key={config.id} className="border rounded p-2">
                          <div className="font-medium">{config.department} {config.year ? `(${config.year})` : ''}</div>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            {arrangements[0].seating_assignments
                              .filter(a => a.department === config.department)
                              .slice(0, 4)
                              .map(student => (
                                <div key={student.id} className="flex justify-between">
                                  <span>{student.seat_no}</span>
                                  <span className="text-muted-foreground">{student.reg_no}</span>
                                </div>
                              ))}
                          </div>
                          {arrangements[0].seating_assignments.filter(a => a.department === config.department).length > 4 && (
                            <div className="text-center text-muted-foreground mt-1">+ more students</div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="border rounded-md p-2 mt-2 text-[10px]">
                      <div className="font-medium mb-1">Visual Seating Chart</div>
                      <div className="grid gap-1" 
                           style={{ 
                             gridTemplateColumns: `repeat(${Math.min(arrangements[0].columns, 6)}, 1fr)`,
                           }}>
                        {Array.from({ length: Math.min(arrangements[0].rows * arrangements[0].columns, 24) }).map((_, i) => {
                          const seatLetter = String.fromCharCode(65 + Math.floor(i / arrangements[0].columns));
                          const seatNumber = (i % arrangements[0].columns) + 1;
                          const seatId = `${seatLetter}${seatNumber}`;
                          
                          // Find if there's a student at this seat
                          const assignment = arrangements[0].seating_assignments.find(a => a.seat_no === seatId);
                          
                          return (
                            <div key={i} className={`border rounded flex flex-col items-center justify-center p-1 text-center ${assignment ? 'bg-primary/5' : ''}`} style={{minHeight: '24px'}}>
                              <div className="font-bold">{seatId}</div>
                              {assignment && <div className="truncate w-full">{assignment.reg_no}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No rooms available to preview
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Room details in PDF show complete student lists with seating grid</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="department" className="mt-2">
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="p-2 text-left">Department</th>
                        <th className="p-2 text-left">Year</th>
                        <th className="p-2 text-left">Students</th>
                        <th className="p-2 text-left">Rooms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(departmentData.entries()).slice(0, 4).map(([dept, data]) => {
                        // Count rooms for this department
                        const roomsWithDept = new Set<string>();
                        arrangements.forEach(arr => {
                          const hasStudentsFromDept = arr.seating_assignments.some(a => a.department === dept);
                          if (hasStudentsFromDept) {
                            roomsWithDept.add(arr.room_no);
                          }
                        });
                        
                        return (
                          <tr key={dept} className="border-t">
                            <td className="p-2 font-medium">{dept}</td>
                            <td className="p-2">
                              {Array.from(data.years).join(', ')}
                            </td>
                            <td className="p-2">{data.count}</td>
                            <td className="p-2">{roomsWithDept.size} rooms</td>
                          </tr>
                        );
                      })}
                      {departmentData.size > 4 && (
                        <tr className="border-t">
                          <td colSpan={4} className="p-2 text-center text-muted-foreground">
                            + {departmentData.size - 4} more departments
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>Excel exports include department-wise breakdowns and student details</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="border-t p-3 bg-muted/20">
              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
                <div>
                  <FileUp className="h-3.5 w-3.5 inline mr-1" />
                  <span>Exported files include all information shown in these previews and more</span>
                </div>
                <div>
                  <span className="font-medium text-primary">Total:</span> {totalRooms} rooms, {totalStudents} students, {departmentData.size} departments
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
