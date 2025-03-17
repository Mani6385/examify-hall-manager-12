
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportButtons } from "./ReportButtons";
import { Button } from "@/components/ui/button";
import { ChevronDown, BarChart, FileSpreadsheet, Users, FileText, Table, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { SeatingArrangement, getHallNameById, formatDepartmentsWithYears } from "@/utils/reportUtils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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

  // Display departments and years information
  const deptYearInfo = arrangements.map(arr => formatDepartmentsWithYears(arr));

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
        </div>
      </CardContent>
    </Card>
  );
}
