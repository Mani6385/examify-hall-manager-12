
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, BarChart, ChevronDown, Users, Table, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ReportActionButtonsProps {
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
}

export function ReportActionButtons({
  isLoadingPdf,
  isLoadingExcel,
  onGeneratePdf,
  onGenerateExcel
}: ReportActionButtonsProps) {
  const { toast } = useToast();

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
  );
}
