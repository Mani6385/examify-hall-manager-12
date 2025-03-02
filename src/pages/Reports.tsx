
import { Layout } from "@/components/dashboard/Layout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HallReportsCard } from "@/components/reports/HallReportsCard";
import { ConsolidatedReportsCard } from "@/components/reports/ConsolidatedReportsCard";
import { generateExcelReport } from "@/components/reports/ExcelExport";
import { generatePdfReport } from "@/components/reports/PdfExport";
import { filterArrangementsByHall, SeatingArrangement, getHallNameById } from "@/utils/reportUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>("all");

  const { data: allSeatingArrangements = [], isLoading, refetch } = useQuery({
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

  // Automatically refetch data when component mounts to ensure latest data from Seating page
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Filter the data based on the selected hall
  const filteredArrangements = filterArrangementsByHall(allSeatingArrangements, selectedHall);

  const generateConsolidatedExcel = async () => {
    try {
      setIsLoadingExcel(true);
      generateExcelReport(filteredArrangements, selectedHall);
      
      toast({
        title: "Success",
        description: `Seating plan Excel file generated successfully for ${getHallNameById(selectedHall)}`,
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
        description: `Seating plan PDF file generated successfully for ${getHallNameById(selectedHall)}`,
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

  // Count rooms and students in the filtered arrangements
  const roomCount = filteredArrangements.length;
  const studentCount = filteredArrangements.reduce(
    (total, arr) => total + arr.seating_assignments.length, 
    0
  );

  // Get unique departments
  const departments = new Set<string>();
  filteredArrangements.forEach(arr => {
    arr.seating_assignments.forEach(assignment => {
      if (assignment.department) {
        departments.add(assignment.department);
      }
    });
  });

  // Navigate to Seating page
  const goToSeatingPage = () => {
    navigate('/seating');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Seating Plan Reports</h2>
            <p className="text-muted-foreground mt-2">
              Generate hall-wise and consolidated seating arrangements reports
            </p>
          </div>
          <Button onClick={goToSeatingPage} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Seating Plan
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Selected Hall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getHallNameById(selectedHall)}</div>
              <p className="text-xs text-muted-foreground">
                {selectedHall === "all" ? "All examination halls" : `Hall ID: ${selectedHall}`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rooms & Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomCount} Rooms</div>
              <p className="text-xs text-muted-foreground">
                {studentCount} Students Assigned
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.size}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(departments).slice(0, 3).map(dept => (
                  <Badge key={dept} variant="outline" className="text-xs">
                    {dept}
                  </Badge>
                ))}
                {departments.size > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{departments.size - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
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
