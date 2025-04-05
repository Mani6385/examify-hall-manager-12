import { Layout } from "@/components/dashboard/Layout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
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
import { AlertCircle, PlusCircle, RefreshCw } from "lucide-react";

const mockArrangements: SeatingArrangement[] = [
  {
    id: "mock-1",
    room_no: "101",
    floor_no: "1", 
    rows: 5,
    columns: 5,
    seating_assignments: Array(10).fill(null).map((_, i) => ({
      id: `mock-assignment-${i}`,
      seat_no: `${i % 2 === 0 ? 'A' : 'B'}${Math.floor(i/2) + 1}`,
      reg_no: `10${i+1}`,
      department: i % 2 === 0 ? "Computer Science" : "Electronics",
      student_name: `Student ${i+1}`
    }))
  }
];

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [useFallbackData, setUseFallbackData] = useState(false);

  const fetchSeatingArrangements = async () => {
    console.log("Fetching seating arrangements...");
    try {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select(`
          id,
          room_no,
          floor_no,
          rows,
          columns,
          seating_assignments!seating_assignments_arrangement_id_fkey (
            id,
            seat_no,
            reg_no,
            department,
            student_name
          )
        `)
        .order('room_no');

      if (error) {
        console.error("Error fetching seating arrangements:", error);
        throw error;
      }
      
      console.log("Fetched seating arrangements:", data);
      
      if (!data || data.length === 0) {
        toast({
          title: "No seating arrangements found",
          description: "Please create seating arrangements first in the Seating page.",
          variant: "destructive",
        });
      }
      
      return data as SeatingArrangement[];
    } catch (error) {
      console.error("Failed to fetch seating arrangements:", error);
      toast({
        title: "Error",
        description: "Failed to load seating arrangements. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const { data: allSeatingArrangements = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['all-seating-arrangements'],
    queryFn: fetchSeatingArrangements,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (isError && !useFallbackData) {
      console.log("Using fallback data due to fetch error");
      setUseFallbackData(true);
      toast({
        title: "Connection Error",
        description: "Using offline mode with sample data. Some features may be limited.",
        variant: "destructive",
      });
    }
  }, [isError, toast, useFallbackData]);

  const displayData = useFallbackData ? mockArrangements : allSeatingArrangements;

  const filteredArrangements = filterArrangementsByHall(displayData, selectedHall);

  const handleRetry = useCallback(() => {
    setUseFallbackData(false);
    refetch();
    toast({
      title: "Retrying connection",
      description: "Attempting to reconnect to the database...",
    });
  }, [refetch, toast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const generateConsolidatedExcel = async () => {
    try {
      if (!filteredArrangements || filteredArrangements.length === 0) {
        toast({
          title: "No Data Available",
          description: `No seating arrangements found for ${getHallNameById(selectedHall)}. Create a seating plan first.`,
          variant: "destructive",
        });
        return;
      }
      
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
      if (!filteredArrangements || filteredArrangements.length === 0) {
        toast({
          title: "No Data Available",
          description: `No seating arrangements found for ${getHallNameById(selectedHall)}. Create a seating plan first.`,
          variant: "destructive",
        });
        return;
      }
      
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

  const handleRemoveArrangement = async (id: string) => {
    try {
      if (useFallbackData) {
        const updatedArrangements = displayData.filter(arr => arr.id !== id);
        setUseFallbackData(false);
        setTimeout(() => {
          setUseFallbackData(true);
        }, 10);
        return;
      }

      const { error: deleteAssignmentsError } = await supabase
        .from('seating_assignments')
        .delete()
        .eq('arrangement_id', id);

      if (deleteAssignmentsError) {
        console.error("Error deleting assignments:", deleteAssignmentsError);
        throw deleteAssignmentsError;
      }

      const { error: deleteConfigsError } = await supabase
        .from('department_configs')
        .delete()
        .eq('arrangement_id', id);

      if (deleteConfigsError) {
        console.error("Error deleting department configs:", deleteConfigsError);
        throw deleteConfigsError;
      }

      const { error: deleteArrangementError } = await supabase
        .from('seating_arrangements')
        .delete()
        .eq('id', id);

      if (deleteArrangementError) {
        console.error("Error deleting arrangement:", deleteArrangementError);
        throw deleteArrangementError;
      }

      refetch();
    } catch (error) {
      console.error("Failed to remove seating arrangement:", error);
      toast({
        title: "Error",
        description: "Failed to remove seating arrangement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const roomCount = filteredArrangements.length;
  const studentCount = filteredArrangements.reduce(
    (total, arr) => total + arr.seating_assignments.length, 
    0
  );

  const departments = new Set<string>();
  filteredArrangements.forEach(arr => {
    arr.seating_assignments.forEach(assignment => {
      if (assignment.department) {
        departments.add(assignment.department);
      }
    });
  });

  const goToSeatingPage = () => {
    navigate('/seating');
  };

  if (isError && !useFallbackData) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              We couldn't connect to the database to load your seating arrangements. This could be due to network issues or server maintenance.
            </p>
            <div className="flex gap-4">
              <Button onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUseFallbackData(true)}
              >
                Continue in Offline Mode
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Seating Plan Reports</h2>
            <p className="text-muted-foreground mt-2">
              Generate hall-wise and consolidated seating arrangements reports
            </p>
            {useFallbackData && (
              <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-300">
                Offline Mode
              </Badge>
            )}
          </div>
          <Button onClick={goToSeatingPage} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Seating Plan
          </Button>
        </div>

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
          isError={isError && !useFallbackData}
          onGeneratePdf={generateConsolidatedPDF}
          onGenerateExcel={generateConsolidatedExcel}
          onRetry={handleRetry}
          onRemoveArrangement={handleRemoveArrangement}
        />

        <div className="grid gap-6">
          <ConsolidatedReportsCard
            isLoading={isLoading}
            isLoadingPdf={isLoadingPdf}
            isLoadingExcel={isLoadingExcel}
            selectedHall={selectedHall}
            arrangements={filteredArrangements}
            onGeneratePdf={generateConsolidatedPDF}
            onGenerateExcel={generateConsolidatedExcel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
