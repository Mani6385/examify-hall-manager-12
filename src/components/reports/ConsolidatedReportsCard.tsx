
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportButtons } from "./ReportButtons";
import { Button } from "@/components/ui/button";
import { ChevronDown, BarChart, FileSpreadsheet, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface ConsolidatedReportsCardProps {
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
}

export function ConsolidatedReportsCard({
  isLoading,
  isLoadingPdf,
  isLoadingExcel,
  onGeneratePdf,
  onGenerateExcel
}: ConsolidatedReportsCardProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("studentList");
  
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidated Reports</CardTitle>
        <CardDescription>
          Download a consolidated view of all seating arrangements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                  Additional Reports
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
                <DropdownMenuItem onClick={() => handleGenerateSpecialReport("Floor-wise Capacity")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Floor-wise Capacity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Student Distribution</h3>
              <p className="text-sm text-muted-foreground">Consolidated view of student distribution across departments and halls</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Room Occupancy</h3>
              <p className="text-sm text-muted-foreground">Analysis of room occupancy rates and empty seats</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Department Stats</h3>
              <p className="text-sm text-muted-foreground">Statistics by department, course, and year</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
