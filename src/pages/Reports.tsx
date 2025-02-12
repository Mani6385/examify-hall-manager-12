
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  student_name: string;
  roll_number: string;
  subject: string;
  exam_date: string;
  start_time: string;
  attended: boolean;
}

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

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

  if (isLoadingExams || isLoadingAttendance) {
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
            Generate attendance reports for exams
          </p>
        </div>

        <div className="space-y-6">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
