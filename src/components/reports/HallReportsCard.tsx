import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HallSelect } from "./HallSelect";
import { ReportButtons } from "./ReportButtons";
import { ArrangementsTable } from "./ArrangementsTable";
import { SeatingArrangement } from "@/utils/reportUtils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Grid, RefreshCw } from "lucide-react";
import { useState } from "react";
import { getHallNameById } from "@/utils/hallUtils";

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
  onRemoveArrangement: (id: string) => void;
  onPrintHallWise?: () => void;
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
  onRetry,
  onRemoveArrangement,
  onPrintHallWise
}: HallReportsCardProps) {
  const { toast } = useToast();
  const [arrangementToDelete, setArrangementToDelete] = useState<string | null>(null);
  
  const handleGenerateExcel = () => {
    if (!filteredArrangements || filteredArrangements.length === 0) {
      toast({
        title: "No Data Available",
        description: `No seating arrangements found for ${getHallNameById(selectedHall)}. Create a seating plan first.`,
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
        description: `No seating arrangements found for ${getHallNameById(selectedHall)}. Create a seating plan first.`,
        variant: "destructive",
      });
      return;
    }
    onGeneratePdf();
  };

  const handleRemoveConfirm = () => {
    if (arrangementToDelete) {
      onRemoveArrangement(arrangementToDelete);
      setArrangementToDelete(null);
      
      toast({
        title: "Seating Plan Removed",
        description: "The seating arrangement has been successfully removed.",
      });
    }
  };

  const handleRemoveRequest = (id: string) => {
    setArrangementToDelete(id);
  };

  const hallName = getHallNameById(selectedHall);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Hall-wise Seating Plans</CardTitle>
            <CardDescription>
              Visual grid-based seating plans by examination hall
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
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
              disabled={filteredArrangements.length === 0}
              onPrintHallWise={onPrintHallWise}
            />
          </div>

          {selectedHall !== "all" && (
            <div className="mb-4">
              <h3 className="text-md font-medium">Selected Hall: <span className="text-indigo-600">{hallName}</span></h3>
              {selectedHall !== "all" && (
                <p className="text-sm text-muted-foreground">
                  Hall ID: {selectedHall} {filteredArrangements.length > 0 && `(Capacity: ${filteredArrangements.length > 0 ? filteredArrangements.reduce((acc, arr) => acc + arr.rows * arr.columns, 0) : 'N/A'} seats)`}
                </p>
              )}
            </div>
          )}
        
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
              onRemoveArrangement={handleRemoveRequest}
            />
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!arrangementToDelete} onOpenChange={(open) => !open && setArrangementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Seating Arrangement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this seating arrangement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
