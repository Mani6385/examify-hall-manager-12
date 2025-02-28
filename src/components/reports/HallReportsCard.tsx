
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HallSelect } from "./HallSelect";
import { ReportButtons } from "./ReportButtons";
import { ArrangementsTable } from "./ArrangementsTable";
import { SeatingArrangement } from "@/utils/reportUtils";

interface HallReportsCardProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
  filteredArrangements: SeatingArrangement[];
  isLoading: boolean;
  isLoadingPdf: boolean;
  isLoadingExcel: boolean;
  onGeneratePdf: () => void;
  onGenerateExcel: () => void;
}

export function HallReportsCard({
  selectedHall,
  setSelectedHall,
  filteredArrangements,
  isLoading,
  isLoadingPdf,
  isLoadingExcel,
  onGeneratePdf,
  onGenerateExcel
}: HallReportsCardProps) {
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
              onGeneratePdf={onGeneratePdf}
              onGenerateExcel={onGenerateExcel}
              isLoading={isLoading}
              isLoadingPdf={isLoadingPdf}
              isLoadingExcel={isLoadingExcel}
            />
          </div>
        
          <ArrangementsTable 
            arrangements={filteredArrangements}
            isLoading={isLoading}
            selectedHall={selectedHall}
          />
        </div>
      </CardContent>
    </Card>
  );
}
