
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HallSelect } from "./HallSelect";
import { ReportButtons } from "./ReportButtons";
import { ArrangementsTable } from "./ArrangementsTable";
import { SeatingArrangement } from "@/utils/reportUtils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface HallReportsCardProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
  filteredArrangements: SeatingArrangement[];
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  isError: boolean;
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
  onRetry: () => void;
}

export function HallReportsCard({
  selectedHall,
  setSelectedHall,
  filteredArrangements,
  isLoading,
  isLoadingPdf,
  isLoadingExcel,
  isError,
  onGeneratePdf,
  onGenerateExcel,
  onRetry
}: HallReportsCardProps) {
  const { toast } = useToast();
  
  const handleGenerateExcel = () => {
    if (!filteredArrangements || filteredArrangements.length === 0) {
      toast({
        title: "No Data Available",
        description: "No seating arrangements to export. Please create a seating plan first.",
        variant: "destructive",
      });
      return;
    }
    onGenerateExcel();
  };

  const handleGeneratePdf = () => {
    if (!filteredArrangements || filteredArrangements.length === 0) {
      toast({
        title: "No Data Available",
        description: "No seating arrangements to export. Please create a seating plan first.",
        variant: "destructive",
      });
      return;
    }
    onGeneratePdf();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hall-wise Reports</CardTitle>
        <CardDescription>
          Filter and generate reports by hall
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <HallSelect 
              selectedHall={selectedHall} 
              setSelectedHall={setSelectedHall} 
            />
            
            <ReportButtons
              onGeneratePdf={handleGeneratePdf}
              onGenerateExcel={handleGenerateExcel}
              isLoading={isLoading}
              isLoadingPdf={isLoadingPdf}
              isLoadingExcel={isLoadingExcel}
            />
          </div>
        
          {isError ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load seating arrangements</h3>
              <p className="text-gray-500 text-center mb-4">
                There was a problem connecting to the database. This could be due to network issues or server maintenance.
              </p>
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </div>
          ) : (
            <ArrangementsTable 
              arrangements={filteredArrangements}
              isLoading={isLoading}
              selectedHall={selectedHall}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
