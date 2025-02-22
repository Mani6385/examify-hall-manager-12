
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useState } from "react";
import { CalendarDays, File, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  subject: string | null;
  seating_arrangements: {
    room_no: string;
    floor_no: string;
  };
}

const Reports = () => {
  const { toast } = useToast();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['seating-assignments'],
    queryFn: async () => {
      const { data: assignmentsData, error } = await supabase
        .from('seating_assignments')
        .select(`
          id,
          seat_no,
          reg_no,
          department,
          seating_arrangements!seating_assignments_arrangement_id_fkey (
            room_no,
            floor_no
          )
        `);

      if (error) {
        console.error('Error fetching seating assignments:', error);
        throw error;
      }

      const transformedData: SeatingAssignment[] = assignmentsData.map((assignment: any) => ({
        id: assignment.id,
        seat_no: assignment.seat_no,
        reg_no: assignment.reg_no,
        department: assignment.department,
        subject: null,
        seating_arrangements: {
          room_no: assignment.seating_arrangements.room_no,
          floor_no: assignment.seating_arrangements.floor_no
        }
      }));

      return transformedData;
    },
  });

  const generateOverallSeatingPlanExcel = async () => {
    try {
      setIsLoadingExcel(true);
      if (!assignments) throw new Error("No assignments data available");

      const wb = XLSX.utils.book_new();

      // Process assignments by room
      const assignmentsByRoom = assignments.reduce((acc: Record<string, SeatingAssignment[]>, curr) => {
        const roomKey = `${curr.seating_arrangements.room_no}-${curr.seating_arrangements.floor_no}`;
        if (!acc[roomKey]) {
          acc[roomKey] = [];
        }
        acc[roomKey].push(curr);
        return acc;
      }, {});

      // Create summary worksheet
      const summaryData = Object.entries(assignmentsByRoom).map(([roomKey, roomAssignments]) => {
        const [roomNo, floorNo] = roomKey.split('-');
        return {
          "Room Number": roomNo,
          "Floor Number": floorNo,
          "Total Seats": roomAssignments.length,
          "Occupied Seats": roomAssignments.filter((a) => a.reg_no).length
        };
      });

      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Create detailed seating plan worksheet
      const allSeatingData = assignments.map((assignment) => ({
        "Room Number": assignment.seating_arrangements.room_no,
        "Floor Number": assignment.seating_arrangements.floor_no,
        "Seat Number": assignment.seat_no,
        "Registration Number": assignment.reg_no || "N/A",
        "Department": assignment.department || "N/A",
        "Subject": assignment.subject || "N/A"
      }));

      const seatingWS = XLSX.utils.json_to_sheet(allSeatingData);
      XLSX.utils.book_append_sheet(wb, seatingWS, "All Seating Plans");

      // Auto-size columns for both worksheets
      [summaryWS, seatingWS].forEach((ws) => {
        const cols = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.c + 1 : 0;
        ws['!cols'] = [];
        for (let i = 0; i < cols; i++) {
          let maxWidth = 10;
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          for (let row = range.s.r; row <= range.e.r; row++) {
            const cell = ws[XLSX.utils.encode_cell({ r: row, c: i })];
            if (cell && cell.v) {
              maxWidth = Math.max(maxWidth, String(cell.v).length + 2);
            }
          }
          ws['!cols'][i] = { wch: maxWidth };
        }
      });

      XLSX.writeFile(wb, 'overall-seating-plan.xlsx');
      
      toast({
        title: "Success",
        description: "Overall seating plan Excel file generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate overall seating plan Excel file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExcel(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate and download exam hall seating arrangement reports
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Seating Summary</h3>
              <p className="text-sm text-muted-foreground">
                Download seating summary in Excel format
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={generateOverallSeatingPlanExcel}
              disabled={isLoadingExcel || isLoading}
            >
              {isLoadingExcel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <File className="mr-2 h-4 w-4" />
                  Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
