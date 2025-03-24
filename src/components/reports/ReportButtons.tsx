
import React from "react";
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
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={onGeneratePdf}
        disabled={isLoading || isLoadingPdf}
      >
        {isLoadingPdf ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Download PDF (One Hall Per Page)
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={onGenerateExcel}
        disabled={isLoading || isLoadingExcel}
      >
        {isLoadingExcel ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <File className="mr-2 h-4 w-4" />
            Download Excel (One Hall Per Page)
          </>
        )}
      </Button>
    </div>
  );
}
