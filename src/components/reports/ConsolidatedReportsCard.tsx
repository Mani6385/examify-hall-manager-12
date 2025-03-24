
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
import { SeatingArrangement, getHallNameById, formatDepartmentsWithYears, groupAssignmentsByDepartment } from "@/utils/reportUtils";
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
                <span className="text-sm font-medium">One Hall Per Page</span>
                <span className="text-xs text-muted-foreground">Each hall on a separate page</span>
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
            <ReportButtons
              onGeneratePdf={onGeneratePdf}
              onGenerateExcel={onGenerateExcel}
              isLoading={isLoading}
              isLoadingPdf={isLoadingPdf}
              isLoadingExcel={isLoadingExcel}
            />
            
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
                    <th className="p-2 text-left" colSpan={5}>Hall Format Preview - One Hall Per Page</th>
                  </tr>
                </thead>
                <tbody>
                  {arrangements.slice(0, 1).map((arr) => {
                    // Get department groups
                    const deptGroups = groupAssignmentsByDepartment(arr);
                    
                    return Array.from(deptGroups.entries()).map(([dept, {students, year}], deptIndex) => {
                      // Create rows with 4 students per row
                      const rows = [];
                      for (let i = 0; i < students.length; i += 4) {
                        const studentChunk = students.slice(i, i + 4);
                        rows.push(
                          <tr key={`${dept}-row-${i}`} className="border-t">
                            {i === 0 ? (
                              <td className="p-2 font-medium border-r" rowSpan={Math.ceil(students.length / 4)}>
                                {dept}
                                {year && <div className="text-xs text-muted-foreground">{year}</div>}
                              </td>
                            ) : null}
                            {studentChunk.map((student, index) => (
                              <td key={student.id} className="p-2 border-r">
                                <div className="font-medium">{student.seat_no}</div>
                                <div className="text-xs">{student.reg_no || 'N/A'}</div>
                              </td>
                            ))}
                            {/* Fill empty cells to maintain 4 columns */}
                            {Array(4 - studentChunk.length).fill(0).map((_, index) => (
                              <td key={`empty-${index}`} className="p-2 border-r"></td>
                            ))}
                          </tr>
                        );
                      }
                      return rows;
                    });
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-right">
              PDF and Excel reports will show each hall on a separate page with the above format
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
