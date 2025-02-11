
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Save, FileText, Signature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun } from 'docx';

interface Student {
  id: string;
  regNo: string;
  name: string;
  department: string;
  signature?: string;
}

interface ExamSession {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  venue: string;
  centerName: string;
  roomName: string;
  teacherSignature?: string;
}

const ExamAttendance = () => {
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([
    { id: "1", regNo: "CS001", name: "John Doe", department: "Computer Science" },
    { id: "2", regNo: "CS002", name: "Jane Smith", department: "Computer Science" },
    { id: "3", regNo: "CS003", name: "Bob Johnson", department: "Computer Science" },
  ]);
  const [examSessions] = useState<ExamSession[]>([
    {
      id: "1",
      subject: "Mathematics",
      date: "2024-02-15",
      startTime: "09:00",
      venue: "Hall A",
      centerName: "Main Campus",
      roomName: "Room 101",
    },
    {
      id: "2",
      subject: "Physics",
      date: "2024-02-16",
      startTime: "14:00",
      venue: "Hall B",
      centerName: "Science Block",
      roomName: "Room 202",
    },
  ]);
  const { toast } = useToast();

  const addStudentSignature = (studentId: string, signature: string) => {
    setStudents(
      students.map((student) =>
        student.id === studentId ? { ...student, signature } : student
      )
    );
  };

  const addTeacherSignature = (examId: string, signature: string) => {
    examSessions.map((exam) =>
      exam.id === examId ? { ...exam, teacherSignature: signature } : exam
    );
  };

  const handleSaveAttendance = () => {
    toast({
      title: "Attendance Saved",
      description: "Exam attendance has been recorded successfully.",
    });
  };

  const downloadAttendanceSheet = () => {
    const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);
    if (!selectedExamSession) {
      toast({
        title: "Error",
        description: "Please select an exam session first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const wsData = [
        ['Exam Attendance Report'],
        [],
        ['Center Name:', selectedExamSession.centerName],
        ['Room:', selectedExamSession.roomName],
        ['Subject:', selectedExamSession.subject],
        ['Date:', selectedExamSession.date],
        ['Time:', selectedExamSession.startTime],
        [],
        ['Registration No', 'Name', 'Department', 'Student Signature'],
        ...students.map(student => [
          student.regNo,
          student.name,
          student.department,
          student.signature || '_____________'
        ]),
        [],
        ['Teacher Signature:', selectedExamSession.teacherSignature || '_____________'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance-${selectedExamSession.subject}-${selectedExamSession.date}.xlsx`);

      toast({
        title: "Success",
        description: "Attendance sheet downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate attendance sheet.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = () => {
    const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);
    if (!selectedExamSession) {
      toast({
        title: "Error",
        description: "Please select an exam session first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Exam Attendance Report", 15, 15);
      
      doc.setFontSize(12);
      doc.text(`Center Name: ${selectedExamSession.centerName}`, 15, 30);
      doc.text(`Room: ${selectedExamSession.roomName}`, 15, 37);
      doc.text(`Subject: ${selectedExamSession.subject}`, 15, 44);
      doc.text(`Date: ${selectedExamSession.date}`, 15, 51);
      doc.text(`Time: ${selectedExamSession.startTime}`, 15, 58);

      const headers = [["Reg No", "Name", "Department", "Student Signature"]];
      
      const data = students.map(student => [
        student.regNo,
        student.name,
        student.department,
        student.signature || "____________"
      ]);

      (doc as any).autoTable({
        head: headers,
        body: data,
        startY: 70,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.text("Teacher Signature: _________________", 15, doc.internal.pageSize.height - 20);

      doc.save(`attendance-${selectedExamSession.subject}-${selectedExamSession.date}.pdf`);

      toast({
        title: "Success",
        description: "PDF report generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive",
      });
    }
  };

  const generateWord = async () => {
    const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);
    if (!selectedExamSession) {
      toast({
        title: "Error",
        description: "Please select an exam session first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Exam Attendance Report", bold: true, size: 32 })],
            }),
            new Paragraph({ children: [] }),
            new Paragraph({
              children: [new TextRun({ text: `Center Name: ${selectedExamSession.centerName}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Room: ${selectedExamSession.roomName}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Subject: ${selectedExamSession.subject}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Date: ${selectedExamSession.date}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Time: ${selectedExamSession.startTime}` })],
            }),
            new Paragraph({ children: [] }),
            new DocxTable({
              rows: [
                new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reg No", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Department", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Student Signature", bold: true })] })] }),
                  ],
                }),
                ...students.map(
                  student => new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.regNo })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.name })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.department })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.signature || "_____________" })] })] }),
                    ],
                  })
                ),
              ],
            }),
            new Paragraph({ children: [] }),
            new Paragraph({
              children: [new TextRun({ text: "Teacher Signature: _____________" })],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${selectedExamSession.subject}-${selectedExamSession.date}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Word document generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Word document.",
        variant: "destructive",
      });
    }
  };

  const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exam Attendance</h2>
          <p className="text-muted-foreground mt-2">
            Record and manage exam hall attendance
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <Select
              value={selectedExam}
              onValueChange={setSelectedExam}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select exam session" />
              </SelectTrigger>
              <SelectContent>
                {examSessions.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.subject} - {exam.date} ({exam.startTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExamSession && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold">Session Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedExamSession.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedExamSession.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedExamSession.startTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium">{selectedExamSession.venue}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Center Name</p>
                  <p className="font-medium">{selectedExamSession.centerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{selectedExamSession.roomName}</p>
                </div>
              </div>
            </div>
          )}

          {selectedExam && (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Student Signature</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.regNo}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>
                          {student.signature || "_____________"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addStudentSignature(student.id, student.name)}
                            >
                              <Signature className="h-4 w-4 mr-1" />
                              Sign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Teacher Signature:</span>
                  <span className="border-b border-gray-300 w-40">
                    {selectedExamSession.teacherSignature || "_____________"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTeacherSignature(selectedExam, "Teacher Name")}
                  >
                    <Signature className="h-4 w-4 mr-1" />
                    Sign
                  </Button>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={generatePDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                  </Button>
                  <Button variant="outline" onClick={generateWord}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to Word
                  </Button>
                  <Button variant="outline" onClick={downloadAttendanceSheet}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button onClick={handleSaveAttendance}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Attendance
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExamAttendance;

