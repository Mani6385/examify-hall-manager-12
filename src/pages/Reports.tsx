
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
import { AlertCircle, ChevronLeft, ChevronRight, PlusCircle, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const mockArrangements: SeatingArrangement[] = [
  {
    id: "mock-1",
    room_no: "101",
    floor_no: "1", 
    rows: 5,
    columns: 5,
    seating_assignments: Array(10).fill(null).map((_, i) => ({
      id: `seat-${i+1}`,
      seat_no: `${i % 2 === 0 ? 'A' : 'B'}${Math.floor(i/2) + 1}`,
      reg_no: `10${i+1}`,
      department: i % 2 === 0 ? "Computer Science" : "Electronics",
      student_name: `Student ${i+1}`
    })),
    department_configs: [
      {
        id: "mock-config-1",
        department: "Computer Science",
        start_reg_no: "101",
        end_reg_no: "105",
        prefix: "A",
        year: "I Year"
      },
      {
        id: "mock-config-2", 
        department: "Electronics",
        start_reg_no: "106",
        end_reg_no: "110",
        prefix: "B",
        year: "II Year"
      }
    ]
  }
];

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [useFallbackData, setUseFallbackData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
          ),
          department_configs (
            id,
            department,
            start_reg_no,
            end_reg_no,
            prefix,
            year
          )
        `)
        .order('room_no');

      if (error) {
        console.error("Error fetching seating arrangements:", error);
        throw error;
      }
      
      // Transform the data to ensure it matches our expected structure
      const transformedData = data?.map(arr => ({
        ...arr,
        seating_assignments: arr.seating_assignments || [],
        department_configs: (arr.department_configs || []).map(config => ({
          ...config,
          // Convert database column names if they differ from our interface
          id: config.id,
          department: config.department,
          start_reg_no: config.start_reg_no,
          end_reg_no: config.end_reg_no,
          prefix: config.prefix,
          year: config.year || null  // Ensure year is properly handled
        }))
      })) || [];
      
      console.log("Fetched seating arrangements:", transformedData);
      
      if (!transformedData || transformedData.length === 0) {
        toast({
          title: "No seating arrangements found",
          description: "Please create seating arrangements first in the Seating page.",
          variant: "destructive",
        });
      }
      
      return transformedData as SeatingArrangement[];
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

  // Extract unique hall IDs from all arrangements
  const getUniqueHallIds = (): string[] => {
    const hallIds = new Set<string>();
    
    // Add 'all' as the first option
    hallIds.add('all');
    
    // Extract hall_id from each arrangement or derive it from room_no
    displayData.forEach(arrangement => {
      if (arrangement.hall_id) {
        hallIds.add(arrangement.hall_id);
      } else {
        // Map rooms to halls based on the first digit of room_no
        const roomFirstDigit = arrangement.room_no.charAt(0);
        const mappedHallId = roomFirstDigit === '1' ? '1' : 
                            roomFirstDigit === '2' ? '2' : '3';
        hallIds.add(mappedHallId);
      }
    });
    
    return Array.from(hallIds);
  };
  
  const uniqueHallIds = getUniqueHallIds();
  
  // Handle hall pagination
  const handlePreviousHall = () => {
    const currentIndex = uniqueHallIds.indexOf(selectedHall);
    if (currentIndex > 0) {
      setSelectedHall(uniqueHallIds[currentIndex - 1]);
      setCurrentPage(1); // Reset to first page when changing halls
    }
  };
  
  const handleNextHall = () => {
    const currentIndex = uniqueHallIds.indexOf(selectedHall);
    if (currentIndex < uniqueHallIds.length - 1) {
      setSelectedHall(uniqueHallIds[currentIndex + 1]);
      setCurrentPage(1); // Reset to first page when changing halls
    }
  };

  const filteredArrangements = filterArrangementsByHall(displayData, selectedHall);
  
  // Calculate pagination for arrangements within the selected hall
  const itemsPerPage = 1; // Show one arrangement per page
  const totalPages = Math.ceil(filteredArrangements.length / itemsPerPage);
  
  // Get current page arrangements
  const currentArrangements = filteredArrangements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        description: `Consolidated seating plan Excel file generated successfully for ${getHallNameById(selectedHall)}`,
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate consolidated seating plan Excel file",
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
        description: `Consolidated seating plan PDF file generated successfully for ${getHallNameById(selectedHall)}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate consolidated seating plan PDF file",
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

  // Get the current arrangement for detailed view
  const currentArrangement = currentArrangements.length > 0 ? currentArrangements[0] : null;

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

        {/* Hall Navigation */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-100">
          <Button 
            variant="outline" 
            onClick={handlePreviousHall}
            disabled={uniqueHallIds.indexOf(selectedHall) === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Hall
          </Button>
          
          <div className="text-center">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              {getHallNameById(selectedHall)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedHall === "all" 
                ? "All examination halls" 
                : `Hall ID: ${selectedHall} (${roomCount} rooms, ${studentCount} students)`}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleNextHall}
            disabled={uniqueHallIds.indexOf(selectedHall) === uniqueHallIds.length - 1}
          >
            Next Hall
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Rooms" 
            value={roomCount} 
            icon={PlusCircle}
            description="Total examination rooms" 
            className="bg-gradient-blue text-white"
          />
          
          <StatCard 
            title="Students" 
            value={studentCount} 
            icon={PlusCircle}
            description="Total assigned students" 
            className="bg-gradient-purple text-white"
          />
          
          <StatCard 
            title="Departments" 
            value={departments.size} 
            icon={PlusCircle}
            description="Unique departments" 
            className="bg-gradient-indigo text-white"
          />
        </div>

        {/* Pagination for arrangements within a hall */}
        {selectedHall !== "all" && filteredArrangements.length > 1 && (
          <Pagination className="my-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <HallReportsCard
          selectedHall={selectedHall}
          setSelectedHall={setSelectedHall}
          filteredArrangements={currentArrangements}
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
