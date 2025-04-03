
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { SeatingArrangement } from "@/utils/reportUtils";
import { ReportHeader } from "./report-settings/ReportHeader";
import { ReportFormatSettings } from "./report-settings/ReportFormatSettings";
import { ReportActionButtons } from "./report-settings/ReportActionButtons";
import { ReportPreviewTable } from "./report-settings/ReportPreviewTable";

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
  const [detailedFormat, setDetailedFormat] = useState<boolean>(true);
  const [includeStudentInfo, setIncludeStudentInfo] = useState<boolean>(true);
  
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
        <ReportHeader 
          selectedHall={selectedHall} 
          totalStudents={totalStudents} 
          totalRooms={totalRooms} 
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ReportFormatSettings 
            detailedFormat={detailedFormat}
            includeStudentInfo={includeStudentInfo}
            onFormatChange={setDetailedFormat}
            onStudentInfoChange={setIncludeStudentInfo}
          />
          
          <ReportActionButtons 
            isLoadingPdf={isLoadingPdf}
            isLoadingExcel={isLoadingExcel}
            onGeneratePdf={onGeneratePdf}
            onGenerateExcel={onGenerateExcel}
          />
          
          <ReportPreviewTable arrangements={arrangements} />
        </div>
      </CardContent>
    </Card>
  );
}
