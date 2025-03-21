
import { Button } from "@/components/ui/button";
import { File, FileText, Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getHallNameById } from "@/utils/hallUtils";

interface ReportButtonsProps {
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
  onPrint?: () => void;
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  isPrintable?: boolean;
  selectedHall?: string;
  hallName?: string;
  availableHalls?: Array<{ id: string; name: string; capacity: number }>;
}

export function ReportButtons({ 
  onGeneratePdf, 
  onGenerateExcel, 
  onPrint,
  isLoading, 
  isLoadingPdf, 
  isLoadingExcel,
  isPrintable = false,
  selectedHall,
  hallName,
  availableHalls
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

  // Get the hall name using the updated function
  const displayHallName = hallName || (selectedHall ? getHallNameById(selectedHall, availableHalls) : undefined);

  return (
    <div className="flex flex-col gap-2">
      {selectedHall && displayHallName && (
        <Badge variant="outline" className="self-start mb-1 bg-primary/5 border-primary/20">
          Generating for: {displayHallName}
        </Badge>
      )}
      
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={onGeneratePdf}
          disabled={isLoading || isLoadingPdf}
          className="bg-white hover:bg-gray-50"
        >
          {isLoadingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4 text-red-500" />
              Download PDF
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onGenerateExcel}
          disabled={isLoading || isLoadingExcel}
          className="bg-white hover:bg-gray-50"
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
        {isPrintable && (
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isLoading}
            className="bg-white hover:bg-gray-50"
          >
            <Printer className="mr-2 h-4 w-4 text-blue-500" />
            Print
          </Button>
        )}
      </div>
    </div>
  );
}
