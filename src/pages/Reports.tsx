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
  seat_no: number;
  reg_no: string;
  department: string;
  subject: string;
  seating_arrangements: {
    room_no: string;
    floor_no: string;
  };
}

const Reports = () => {
  const { toast } = useToast();
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['seating-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_assignments')
        .select('*, seating_arrangements!inner(room_no, floor_no)');

      if (error) {
        console.error('Error fetching seating assignments:', error);
        throw error;
      }

      return data as SeatingAssignment[];
    },
  });

  const generateOverallSeatingPlanPDF = async () => {
    try {
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('seating_assignments')
        .select('*, seating_arrangements!inner(room_no, floor_no)');

      if (assignmentsError) throw assignmentsError;

      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Overall Seating Plan - All Halls", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      const assignmentsByRoom = allAssignments.reduce((acc: any, curr: any) => {
        const roomKey = `${curr.seating_arrangements.room_no}-${curr.seating_arrangements.floor_no}`;
        if (!acc[roomKey]) {
          acc[roomKey] = [];
        }
        acc[roomKey].push(curr);
        return acc;
      }, {});

      let currentY = 40;

      Object.entries(assignmentsByRoom).forEach(([roomKey, assignments]: [string, any]) => {
        if (currentY > doc.internal.pageSize.height - 40) {
          doc.addPage();
          currentY = 40;
        }

        const [roomNo, floorNo] = roomKey.split('-');
        doc.setFontSize(14);
        doc.text(`Room ${roomNo} - Floor ${floorNo}`, 20, currentY);
        currentY += 10;

        const headers = ["Seat No", "Registration No", "Department", "Subject"];
        const startX = 20;
        const cellWidth = 45; // Increased width since we removed one column
        const cellHeight = 10;

        // Draw Headers with gray background
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, currentY - 6, cellWidth * headers.length, cellHeight, 'F');
        doc.setFontSize(10);
        headers.forEach((header, i) => {
          doc.text(header, startX + (i * cellWidth) + 2, currentY);
        });
        currentY += cellHeight;

        // Draw Data Rows
        assignments.forEach((assignment: any) => {
          if (currentY > doc.internal.pageSize.height - 20) {
            doc.addPage();
            currentY = 40;
          }

          const rowData = [
            assignment.seat_no,
            assignment.reg_no || "N/A",
            assignment.department || "N/A",
            assignment.subject || "N/A"
          ];

          // Draw cell borders and text
          rowData.forEach((text, i) => {
            doc.rect(startX + (i * cellWidth), currentY - 6, cellWidth, cellHeight);
            doc.text(text.toString(), startX + (i * cellWidth) + 2, currentY);
          });
          currentY += cellHeight;
        });

        currentY += 20; // Add space between room tables
      });

      doc.save('overall-seating-plan.pdf');
      
      toast({
        title: "Success",
        description: "Overall seating plan PDF generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate overall seating plan PDF",
        variant: "destructive",
      });
    }
  };

  const generateOverallSeatingPlanExcel = async () => {
    try {
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('seating_assignments')
        .select('*, seating_arrangements!inner(room_no, floor_no)');

      if (assignmentsError) throw assignmentsError;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Process assignments by room
      const assignmentsByRoom = allAssignments.reduce((acc: any, curr: any) => {
        const roomKey = `${curr.seating_arrangements.room_no}-${curr.seating_arrangements.floor_no}`;
        if (!acc[roomKey]) {
          acc[roomKey] = [];
        }
        acc[roomKey].push(curr);
        return acc;
      }, {});

      // Create summary worksheet
      const summaryData = Object.entries(assignmentsByRoom).map(([roomKey, assignments]: [string, any]) => {
        const [roomNo, floorNo] = roomKey.split('-');
        return {
          "Room Number": roomNo,
          "Floor Number": floorNo,
          "Total Seats": assignments.length,
          "Occupied Seats": assignments.filter((a: any) => a.reg_no).length
        };
      });

      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Create detailed seating plan worksheet without student names
      const allSeatingData = allAssignments.map((assignment: any) => ({
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
              <h3 className="text-lg font-semibold">Overall Seating Plan</h3>
              <p className="text-sm text-muted-foreground">
                Generate a detailed report of the entire seating arrangement.
              </p>
            </div>
            <div className="space-x-2">
              <Button
                onClick={generateOverallSeatingPlanPDF}
                disabled={isLoadingPDF}
              >
                {isLoadingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={generateOverallSeatingPlanExcel}
                disabled={isLoadingExcel}
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

          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Upcoming Exams</h3>
              <p className="text-sm text-muted-foreground">
                View a list of all upcoming exams and their schedules.
              </p>
            </div>
            <Button variant="outline" disabled>
              <CalendarDays className="mr-2 h-4 w-4" />
              View Exams
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
