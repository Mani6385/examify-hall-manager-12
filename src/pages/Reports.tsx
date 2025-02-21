import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Interfaces
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

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  exam_date: string;
  subject: string;
  attended: boolean;
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

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: examSummaries = [], isLoading: isLoadingExams } = useQuery<ExamSummary[]>({
    queryKey: ['examSummaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_attendance_summary')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_attendance_history')
        .select('*')
        .order('student_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: seatingPlans = [], isLoading: isLoadingSeating } = useQuery<SeatingPlan[]>({
    queryKey: ['seatingPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const deleteExamSummaryMutation = useMutation<void, Error, string>({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('exam_attendance_summary')
        .delete()
        .eq('exam_id', examId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examSummaries'] });
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  });

  const deleteSeatingPlanMutation = useMutation<void, Error, string>({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('seating_arrangements')
        .delete()
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seatingPlans'] });
      toast({
        title: "Success",
        description: "Seating plan deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete seating plan",
        variant: "destructive",
      });
    }
  });

  const generatePDF = (examSummary: ExamSummary) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Exam Attendance Report", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
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

      const records = attendanceRecords.filter(
        record => record.subject === examSummary.subject && record.exam_date === examSummary.date
      );

      const headers = ["Roll Number", "Student Name", "Status"];
      const columnWidths = [40, 80, 40];
      const startTableY = startY + 8 * lineHeight;
      let currentY = startTableY;

      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 6, doc.internal.pageSize.width - 40, 8, 'F');
      let currentX = 20;
      
      headers.forEach((header, index) => {
        doc.text(header, currentX, currentY);
        currentX += columnWidths[index];
      });
      
      currentY += 10;

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
      const { data: assignments, error } = await supabase
        .from('seating_assignments')
        .select('*')
        .eq('arrangement_id', seatingPlan.id)
        .order('position');

      if (error) throw error;

      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Seating Plan", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      const startY = 40;
      const lineHeight = 8;
      
      doc.text(`Room Number: ${seatingPlan.room_no}`, 20, startY);
      doc.text(`Floor Number: ${seatingPlan.floor_no}`, 20, startY + lineHeight);
      doc.text(`Date: ${new Date(seatingPlan.created_at).toLocaleDateString()}`, 20, startY + 2 * lineHeight);

      const cellWidth = 40;
      const cellHeight = 30;
      let startGridY = startY + 4 * lineHeight;
      const margin = 20;

      assignments?.forEach((assignment, index) => {
        const row = Math.floor(index / seatingPlan.columns);
        const col = index % seatingPlan.columns;
        const x = margin + (col * cellWidth);
        const y = startGridY + (row * cellHeight);

        doc.rect(x, y, cellWidth, cellHeight);

        doc.setFontSize(10);
        doc.text(assignment.seat_no, x + 2, y + 10);
        if (assignment.student_name) {
          doc.text(assignment.student_name, x + 2, y + 20, { maxWidth: cellWidth - 4 });
        }
        if (assignment.reg_no) {
          doc.text(assignment.reg_no, x + 2, y + 25);
        }

        if (y + cellHeight > doc.internal.pageSize.height - margin) {
          doc.addPage();
          startGridY = margin;
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

        const headers = ["Seat No", "Student Name", "Registration No", "Department"];
        const data = assignments.map((a: any) => [
          a.seat_no,
          a.student_name || "Not assigned",
          a.reg_no || "N/A",
          a.department || "N/A"
        ]);

        doc.setFontSize(10);
        const startX = 20;
        const cellWidth = 40;
        const cellHeight = 10;

        headers.forEach((header, i) => {
          doc.rect(startX + (i * cellWidth), currentY, cellWidth, cellHeight);
          doc.text(header, startX + (i * cellWidth) + 2, currentY + 7);
        });
        currentY += cellHeight;

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

        currentY += 20;
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate attendance and seating plan reports
          </p>
        </div>

        {/* Exam Reports Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Exam Attendance Reports</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examSummaries.map((examSummary) => (
                <TableRow key={examSummary.exam_id}>
                  <TableCell className="font-medium">{examSummary.subject}</TableCell>
                  <TableCell>{examSummary.date}</TableCell>
                  <TableCell>{examSummary.start_time}</TableCell>
                  <TableCell>{examSummary.venue}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button onClick={() => generatePDF(examSummary)} size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button onClick={() => generateExcel(examSummary)} size="sm" variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                      <Button 
                        onClick={() => deleteExamSummaryMutation.mutate(examSummary.exam_id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Seating Plans Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Seating Plan Reports</h3>
            <Button onClick={generateOverallSeatingPlanPDF} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Overall Seating Plan
            </Button>
          </div>
          
          {seatingPlans.length === 0 ? (
            <p className="text-muted-foreground">No seating plans available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Number</TableHead>
                  <TableHead>Floor Number</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seatingPlans.map((seatingPlan) => (
                  <TableRow key={seatingPlan.id}>
                    <TableCell className="font-medium">{seatingPlan.room_no}</TableCell>
                    <TableCell>{seatingPlan.floor_no}</TableCell>
                    <TableCell>{seatingPlan.rows} × {seatingPlan.columns}</TableCell>
                    <TableCell>{new Date(seatingPlan.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => generateSeatingPlanPDF(seatingPlan)} size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button onClick={() => generateSeatingPlanExcel(seatingPlan)} size="sm" variant="outline">
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          Excel
                        </Button>
                        <Button 
                          onClick={() => deleteSeatingPlanMutation.mutate(seatingPlan.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
