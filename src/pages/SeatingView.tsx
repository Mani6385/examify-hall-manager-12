
import { useEffect, useState } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SeatingArrangement } from "@/utils/reportUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { VisualSeatingChart } from "@/components/seating/VisualSeatingChart";
import { generatePdfReport } from "@/components/reports/PdfExport";
import { generateExcelReport } from "@/components/reports/ExcelExport";

const SeatingView = () => {
  const [searchParams] = useSearchParams();
  const arrangementId = searchParams.get('id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [arrangement, setArrangement] = useState<SeatingArrangement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  useEffect(() => {
    const fetchArrangement = async () => {
      if (!arrangementId) {
        toast({
          title: "Error",
          description: "No seating arrangement ID provided",
          variant: "destructive",
        });
        navigate('/reports');
        return;
      }

      setIsLoading(true);
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
          .eq('id', arrangementId)
          .single();

        if (error) {
          console.error("Error fetching seating arrangement:", error);
          toast({
            title: "Error",
            description: "Failed to load seating arrangement. Please try again.",
            variant: "destructive",
          });
          navigate('/reports');
          return;
        }

        if (!data) {
          toast({
            title: "Error",
            description: "Seating arrangement not found",
            variant: "destructive",
          });
          navigate('/reports');
          return;
        }

        // Transform the data to match the SeatingArrangement type
        const transformedArrangement: SeatingArrangement = {
          ...data,
          seating_assignments: data.seating_assignments || [],
          department_configs: (data.department_configs || []).map(config => ({
            ...config,
            id: config.id,
            department: config.department,
            start_reg_no: config.start_reg_no,
            end_reg_no: config.end_reg_no,
            prefix: config.prefix,
            year: config.year || null
          }))
        };

        setArrangement(transformedArrangement);
      } catch (error) {
        console.error("Failed to fetch seating arrangement:", error);
        toast({
          title: "Error",
          description: "Failed to load seating arrangement. Please try again.",
          variant: "destructive",
        });
        navigate('/reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArrangement();
  }, [arrangementId, navigate, toast]);

  const goBack = () => {
    navigate('/reports');
  };

  const handleGeneratePdf = () => {
    if (!arrangement) return;
    
    setIsGeneratingPdf(true);
    try {
      generatePdfReport([arrangement], arrangement.hall_id || 'single');
      toast({
        title: "Success",
        description: "Seating plan PDF generated successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateExcel = () => {
    if (!arrangement) return;
    
    setIsGeneratingExcel(true);
    try {
      generateExcelReport([arrangement], arrangement.hall_id || 'single');
      toast({
        title: "Success",
        description: "Seating plan Excel file generated successfully",
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast({
        title: "Error",
        description: "Failed to generate Excel file",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading seating plan...</p>
        </div>
      </Layout>
    );
  }

  if (!arrangement) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-lg font-medium mb-4">Seating plan not found</p>
          <Button onClick={goBack}>Back to Reports</Button>
        </div>
      </Layout>
    );
  }

  // Transform seating assignments to the format expected by VisualSeatingChart
  const seats = arrangement.seating_assignments.map(assignment => ({
    id: assignment.id,
    seatNo: assignment.seat_no,
    regNo: assignment.reg_no || '',
    studentName: assignment.student_name || '',
    department: assignment.department || ''
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleGenerateExcel}
              disabled={isGeneratingExcel}
              className="gap-2 border-green-200 hover:bg-green-50"
            >
              {isGeneratingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-green-600" />
                  Excel
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="gap-2 border-blue-200 hover:bg-blue-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 text-blue-600" />
                  PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Room {arrangement.room_no}, Floor {arrangement.floor_no} - Seating Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{arrangement.room_no}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="font-medium">{arrangement.floor_no}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{arrangement.rows} rows × {arrangement.columns} columns</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="font-medium">{arrangement.seating_assignments.length}</p>
                </div>
              </div>
            </div>

            <VisualSeatingChart 
              seats={seats}
              rows={arrangement.rows}
              cols={arrangement.columns}
              departments={arrangement.department_configs}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SeatingView;
