
import { Button } from "@/components/ui/button";
import { File, FileText, Loader2 } from "lucide-react";

interface ReportButtonsProps {
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
}

export function ReportButtons({ 
  onGeneratePdf, 
  onGenerateExcel, 
  isLoading, 
  isLoadingPdf, 
  isLoadingExcel 
}: ReportButtonsProps) {
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={onGeneratePdf}
        disabled={isLoading || isLoadingPdf}
        className="border-blue-200 hover:bg-blue-50"
      >
        {isLoadingPdf ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4 text-blue-600" />
            Download PDF
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={onGenerateExcel}
        disabled={isLoading || isLoadingExcel}
        className="border-green-200 hover:bg-green-50"
      >
        {isLoadingExcel ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Excel...
          </>
        ) : (
          <>
            <File className="mr-2 h-4 w-4 text-green-600" />
            Download Excel
          </>
        )}
      </Button>
    </div>
  );
}
