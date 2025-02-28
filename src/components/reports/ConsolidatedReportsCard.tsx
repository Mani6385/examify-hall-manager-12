
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportButtons } from "./ReportButtons";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidated Reports</CardTitle>
        <CardDescription>
          Download a consolidated view of all seating arrangements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReportButtons
          onGeneratePdf={onGeneratePdf}
          onGenerateExcel={onGenerateExcel}
          isLoading={isLoading}
          isLoadingPdf={isLoadingPdf}
          isLoadingExcel={isLoadingExcel}
        />
      </CardContent>
    </Card>
  );
}
