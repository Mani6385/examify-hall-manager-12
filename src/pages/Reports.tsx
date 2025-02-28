
import { Layout } from "@/components/dashboard/Layout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HallReportsCard } from "@/components/reports/HallReportsCard";
import { ConsolidatedReportsCard } from "@/components/reports/ConsolidatedReportsCard";
import { generateExcelReport } from "@/components/reports/ExcelExport";
import { generatePdfReport } from "@/components/reports/PdfExport";
import { filterArrangementsByHall, SeatingArrangement } from "@/utils/reportUtils";

const Reports = () => {
  const { toast } = useToast();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>("all");

  const { data: allSeatingArrangements = [], isLoading } = useQuery({
    queryKey: ['all-seating-arrangements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select(`
          id,
          room_no,
          floor_no,
          rows,
          columns,
          seating_assignments (
            id,
            seat_no,
            reg_no,
            department,
            student_name
          )
        `)
        .order('room_no');

      if (error) throw error;
      return data as SeatingArrangement[];
    },
  });

  // Filter the data based on the selected hall
  const filteredArrangements = filterArrangementsByHall(allSeatingArrangements, selectedHall);

  const generateConsolidatedExcel = async () => {
    try {
      setIsLoadingExcel(true);
      generateExcelReport(filteredArrangements, selectedHall);
      
      toast({
        title: "Success",
        description: `Seating plan Excel file generated successfully`,
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate seating plan Excel file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const generateConsolidatedPDF = async () => {
    try {
      setIsLoadingPdf(true);
      generatePdfReport(filteredArrangements, selectedHall);
      
      toast({
        title: "Success",
        description: `Seating plan PDF file generated successfully`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate seating plan PDF file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seating Plan Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate consolidated seating arrangements reports
          </p>
        </div>

        <HallReportsCard
          selectedHall={selectedHall}
          setSelectedHall={setSelectedHall}
          filteredArrangements={filteredArrangements}
          isLoading={isLoading}
          isLoadingPdf={isLoadingPdf}
          isLoadingExcel={isLoadingExcel}
          onGeneratePdf={generateConsolidatedPDF}
          onGenerateExcel={generateConsolidatedExcel}
        />

        <div className="grid gap-6">
          <ConsolidatedReportsCard
            isLoading={isLoading}
            isLoadingPdf={isLoadingPdf}
            isLoadingExcel={isLoadingExcel}
            onGeneratePdf={generateConsolidatedPDF}
            onGenerateExcel={generateConsolidatedExcel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
