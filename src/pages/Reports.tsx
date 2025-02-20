
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Grid3X3, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ExamSummary {
  exam_id: string;
  subject: string;
  date: string;
  start_time: string;
  venue: string;
  center_name: string;
  total_attendance: number;
  total_students: number;
}

interface SeatingPlan {
  id: string;
  room_no: string;
  floor_no: string;
  rows: number;
  columns: number;
  exam_id: string | null;
  created_at: string;
}

interface SeatingAssignment {
  seat_no: string;
  student_name: string | null;
  reg_no: string | null;
  department: string | null;
  position: number;
}

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  exam_date: string;
  subject: string;
  attended: boolean;
}

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch exam summaries
  const { data: examSummaries = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['examSummaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_attendance_summary')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as ExamSummary[];
    },
  });

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendanceRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_attendance_history')
        .select('*')
        .order('student_name');
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  // Fetch seating arrangements
  const { data: seatingPlans = [], isLoading: isLoadingSeating } = useQuery({
    queryKey: ['seatingPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SeatingPlan[];
    },
  });

  // Delete mutations
  const deleteExamSummaryMutation = useMutation({
    mutationFn: async (examId: string) => {
      // First delete related attendance records
      const { error: attendanceError } = await supabase
        .from('student_attendance_history')
        .delete()
        .match({ exam_id: examId });
      
      if (attendanceError) throw attendanceError;

      // Then delete the exam summary
      const { error: summaryError } = await supabase
        .from('exam_attendance_summary')
        .delete()
        .match({ exam_id: examId });
      
      if (summaryError) throw summaryError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  const deleteSeatingPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      // First delete related seating assignments
      const { error: assignmentsError } = await supabase
        .from('seating_assignments')
        .delete()
        .match({ arrangement_id: planId });
      
      if (assignmentsError) throw assignmentsError;

      // Then delete the seating plan
      const { error: planError } = await supabase
        .from('seating_arrangements')
        .delete()
        .match({ id: planId });
      
      if (planError) throw planError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seatingPlans'] });
      toast({
        title: "Success",
        description: "Seating plan deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete seating plan",
        variant: "destructive",
      });
    },
  });

  const generatePDF = (examSummary: ExamSummary) => {
    try {
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(16);
      doc.text("Exam Attendance Report", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      // Add metadata
      doc.setFontSize(12);
      const startY = 40;
      const lineHeight = 8;
      
      doc.text(`Center Name: ${examSummary.center_name}`, 20, startY);
      doc.text(`Subject: ${examSummary.subject}`, 20, startY + lineHeight);
      doc.text(`Date: ${examSummary.date}`, 20, startY + 2 * lineHeight);
      doc.text(`Time: ${examSummary.start_time}`, 20, startY + 3 * lineHeight);
      doc.text(`Venue: ${examSummary.venue}`, 20, startY + 4 * lineHeight);
      doc.text(`Total Students: ${examSummary.total_students}`, 20, startY + 5 * lineHeight);
      doc.text(`Total Attendance: ${examSummary.total_attendance}`, 20, startY + 6 * lineHeight);

      // Table configuration
      const records = attendanceRecords.filter(
        record => record.subject === examSummary.subject && record.exam_date === examSummary.date
      );

      const headers = ["Roll Number", "Student Name", "Status"];
      const columnWidths = [40, 80, 40];
      const startTableY = startY + 8 * lineHeight;
      let currentY = startTableY;

      // Draw table header
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 6, doc.internal.pageSize.width - 40, 8, 'F');
      let currentX = 20;
      
      headers.forEach((header, index) => {
        doc.text(header, currentX, currentY);
        currentX += columnWidths[index];
      });
      
      currentY += 10;

      // Draw table content
      records.forEach((record) => {
        if (currentY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          currentY = 20;
        }

        currentX = 20;
        const rowData = [
          record.roll_number,
          record.student_name,
          record.attended ? "Present" : "Absent"
        ];

        rowData.forEach((text, colIndex) => {
          doc.rect(currentX, currentY - 6, columnWidths[colIndex], 8);
          doc.text(text, currentX + 2, currentY);
          currentX += columnWidths[colIndex];
        });

        currentY += 10;
      });
      
      doc.save(`attendance-${examSummary.subject}-${examSummary.date}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const generateExcel = (examSummary: ExamSummary) => {
    try {
      const records = attendanceRecords.filter(
        record => record.subject === examSummary.subject && record.exam_date === examSummary.date
      );

      const excelData = records.map(record => ({
        "Roll Number": record.roll_number,
        "Student Name": record.student_name,
        "Status": record.attended ? "Present" : "Absent"
      }));
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet([
        {
          "Center Name": examSummary.center_name,
          "Subject": examSummary.subject,
          "Date": examSummary.date,
          "Time": examSummary.start_time,
          "Venue": examSummary.venue,
          "Total Students": examSummary.total_students,
          "Total Attendance": examSummary.total_attendance
        },
        ...excelData
      ]);
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      
      XLSX.writeFile(wb, `attendance-${examSummary.subject}-${examSummary.date}.xlsx`);
      
      toast({
        title: "Success",
        description: "Excel file generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Excel file",
        variant: "destructive",
      });
    }
  };

  const generateSeatingPlanPDF = async (seatingPlan: SeatingPlan) => {
    try {
      // Fetch seating assignments for this arrangement
      const { data: assignments, error } = await supabase
        .from('seating_assignments')
        .select('*')
        .eq('arrangement_id', seatingPlan.id)
        .order('position');

      if (error) throw error;

      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(16);
      doc.text("Seating Plan", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      // Add metadata
      doc.setFontSize(12);
      const startY = 40;
      const lineHeight = 8;
      
      doc.text(`Room Number: ${seatingPlan.room_no}`, 20, startY);
      doc.text(`Floor Number: ${seatingPlan.floor_no}`, 20, startY + lineHeight);
      doc.text(`Date: ${new Date(seatingPlan.created_at).toLocaleDateString()}`, 20, startY + 2 * lineHeight);

      // Draw seating grid
      const cellWidth = 40;
      const cellHeight = 30;
      let startGridY = startY + 4 * lineHeight; // Changed to let
      const margin = 20;

      assignments?.forEach((assignment, index) => {
        const row = Math.floor(index / seatingPlan.columns);
        const col = index % seatingPlan.columns;
        const x = margin + (col * cellWidth);
        const y = startGridY + (row * cellHeight);

        // Draw cell border
        doc.rect(x, y, cellWidth, cellHeight);

        // Add seat information
        doc.setFontSize(10);
        doc.text(assignment.seat_no, x + 2, y + 10);
        if (assignment.student_name) {
          doc.text(assignment.student_name, x + 2, y + 20, { maxWidth: cellWidth - 4 });
        }
        if (assignment.reg_no) {
          doc.text(assignment.reg_no, x + 2, y + 25);
        }

        // Add new page if needed
        if (y + cellHeight > doc.internal.pageSize.height - margin) {
          doc.addPage();
          startGridY = margin; // Now we can modify this value
        }
      });
      
      doc.save(`seating-plan-${seatingPlan.room_no}-${seatingPlan.floor_no}.pdf`);
      
      toast({
        title: "Success",
        description: "Seating plan PDF generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate seating plan PDF",
        variant: "destructive",
      });
    }
  };

  const generateSeatingPlanExcel = async (seatingPlan: SeatingPlan) => {
    try {
      const { data: assignments, error } = await supabase
        .from('seating_assignments')
        .select('*')
        .eq('arrangement_id', seatingPlan.id)
        .order('position');

      if (error) throw error;

      const excelData = assignments?.map(assignment => ({
        "Seat No": assignment.seat_no,
        "Student Name": assignment.student_name || "",
        "Registration No": assignment.reg_no || "",
        "Department": assignment.department || "",
        "Position": assignment.position + 1
      }));
      
      const ws = XLSX.utils.json_to_sheet([
        {
          "Room Number": seatingPlan.room_no,
          "Floor Number": seatingPlan.floor_no,
          "Date": new Date(seatingPlan.created_at).toLocaleDateString(),
          "Rows": seatingPlan.rows,
          "Columns": seatingPlan.columns
        },
        ...excelData
      ]);
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Seating Plan");
      
      XLSX.writeFile(wb, `seating-plan-${seatingPlan.room_no}-${seatingPlan.floor_no}.xlsx`);
      
      toast({
        title: "Success",
        description: "Seating plan Excel file generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate seating plan Excel file",
        variant: "destructive",
      });
    }
  };

  const generateOverallSeatingPlanPDF = async () => {
    try {
      // Fetch all seating assignments for all plans
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('seating_assignments')
        .select('*, seating_arrangements!inner(room_no, floor_no)');

      if (assignmentsError) throw assignmentsError;

      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(16);
      doc.text("Overall Seating Plan - All Halls", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      // Group assignments by room
      const assignmentsByRoom = allAssignments.reduce((acc: any, curr: any) => {
        const roomKey = `${curr.seating_arrangements.room_no}-${curr.seating_arrangements.floor_no}`;
        if (!acc[roomKey]) {
          acc[roomKey] = [];
        }
        acc[roomKey].push(curr);
        return acc;
      }, {});

      let currentY = 40;

      // Iterate through each room
      Object.entries(assignmentsByRoom).forEach(([roomKey, assignments]: [string, any]) => {
        // Add new page if not enough space
        if (currentY > doc.internal.pageSize.height - 40) {
          doc.addPage();
          currentY = 40;
        }

        // Add room header
        const [roomNo, floorNo] = roomKey.split('-');
        doc.setFontSize(14);
        doc.text(`Room ${roomNo} - Floor ${floorNo}`, 20, currentY);
        currentY += 10;

        // Create table for this room
        const headers = ["Seat No", "Student Name", "Registration No", "Department"];
        const data = assignments.map((a: any) => [
          a.seat_no,
          a.student_name || "Not assigned",
          a.reg_no || "N/A",
          a.department || "N/A"
        ]);

        // Add table
        doc.setFontSize(10);
        const startX = 20;
        const cellWidth = 40;
        const cellHeight = 10;

        // Draw headers
        headers.forEach((header, i) => {
          doc.rect(startX + (i * cellWidth), currentY, cellWidth, cellHeight);
          doc.text(header, startX + (i * cellWidth) + 2, currentY + 7);
        });
        currentY += cellHeight;

        // Draw data
        data.forEach((row: string[]) => {
          if (currentY > doc.internal.pageSize.height - 20) {
            doc.addPage();
            currentY = 40;
          }

          row.forEach((cell, i) => {
            doc.rect(startX + (i * cellWidth), currentY, cellWidth, cellHeight);
            doc.text(cell.toString(), startX + (i * cellWidth) + 2, currentY + 7);
          });
          currentY += cellHeight;
        });

        currentY += 20; // Add space between rooms
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

  if (isLoadingExams || isLoadingAttendance || isLoadingSeating) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Loading reports...</p>
        </div>
      </Layout>
    );
  }

  if (!examSummaries.length) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No exam data available</p>
          <Button onClick={() => navigate('/exams')} variant="outline">
            Go to Exams
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate attendance and seating plan reports
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Exam Attendance Reports</h3>
          {examSummaries.map((examSummary) => (
            <div key={examSummary.exam_id} className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Subject:</span>
                  <p className="font-medium">{examSummary.subject}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <p className="font-medium">{examSummary.date}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <p className="font-medium">{examSummary.start_time}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Venue:</span>
                  <p className="font-medium">{examSummary.venue}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Center:</span>
                  <p className="font-medium">{examSummary.center_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Students:</span>
                  <p className="font-medium">{examSummary.total_students}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Attendance:</span>
                  <p className="font-medium">{examSummary.total_attendance}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Percentage:</span>
                  <p className="font-medium">
                    {examSummary.total_students > 0
                      ? ((examSummary.total_attendance / examSummary.total_students) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => generatePDF(examSummary)} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </Button>
                
                <Button onClick={() => generateExcel(examSummary)} variant="outline" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </Button>

                <Button 
                  onClick={() => deleteExamSummaryMutation.mutate(examSummary.exam_id)} 
                  variant="destructive"
                  disabled={deleteExamSummaryMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Report
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Seating Plan Reports</h3>
            <Button onClick={generateOverallSeatingPlanPDF} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Overall Seating Plan
            </Button>
          </div>
          {seatingPlans.map((seatingPlan) => (
            <div key={seatingPlan.id} className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Room:</span>
                  <p className="font-medium">{seatingPlan.room_no}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Floor:</span>
                  <p className="font-medium">{seatingPlan.floor_no}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Layout:</span>
                  <p className="font-medium">{seatingPlan.rows} × {seatingPlan.columns}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {new Date(seatingPlan.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => generateSeatingPlanPDF(seatingPlan)} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </Button>
                
                <Button onClick={() => generateSeatingPlanExcel(seatingPlan)} variant="outline" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </Button>

                <Button 
                  onClick={() => deleteSeatingPlanMutation.mutate(seatingPlan.id)}
                  variant="destructive"
                  disabled={deleteSeatingPlanMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
