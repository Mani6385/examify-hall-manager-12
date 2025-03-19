
import { Button } from "@/components/ui/button";
import { File, FileText, Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportButtonsProps {
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
  onPrint?: () => void;
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  isPrintable?: boolean;
}

export function ReportButtons({ 
  onGeneratePdf, 
  onGenerateExcel, 
  onPrint,
  isLoading, 
  isLoadingPdf, 
  isLoadingExcel,
  isPrintable = false
}: ReportButtonsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      toast({
        title: "Print function",
        description: "Print function triggered through browser",
      });
      window.print();
    }
  };

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
            Download PDF
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
            Download Excel
          </>
        )}
      </Button>
      {isPrintable && (
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={isLoading}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      )}
    </div>
  );
}
