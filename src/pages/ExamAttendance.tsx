
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
import { UserCheck, UserX, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Student {
  id: string;
  regNo: string;
  name: string;
  department: string;
  status: "present" | "absent" | null;
}

interface ExamSession {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  venue: string;
  centerName: string;
  roomName: string;
}

const ExamAttendance = () => {
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([
    { id: "1", regNo: "CS001", name: "John Doe", department: "Computer Science", status: null },
    { id: "2", regNo: "CS002", name: "Jane Smith", department: "Computer Science", status: null },
    { id: "3", regNo: "CS003", name: "Bob Johnson", department: "Computer Science", status: null },
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

  const markAttendance = (studentId: string, status: "present" | "absent") => {
    setStudents(
      students.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const handleSaveAttendance = () => {
    const unmarkedStudents = students.filter((student) => student.status === null);
    if (unmarkedStudents.length > 0) {
      toast({
        title: "Incomplete Attendance",
        description: "Please mark attendance for all students before saving.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Attendance Saved",
      description: "Exam attendance has been recorded successfully.",
    });
  };

  const downloadAttendanceSheet = () => {
    const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);
    if (!selectedExamSession) return;

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text("Exam Attendance Sheet", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      // Exam Details
      doc.setFontSize(12);
      doc.text(`Center Name: ${selectedExamSession.centerName}`, 20, 40);
      doc.text(`Room: ${selectedExamSession.roomName}`, 20, 50);
      doc.text(`Subject: ${selectedExamSession.subject}`, 20, 60);
      doc.text(`Date: ${selectedExamSession.date}`, 20, 70);
      doc.text(`Time: ${selectedExamSession.startTime}`, 20, 80);

      // Table Header
      const headers = ["Reg No", "Name", "Department", "Status", "Student Signature"];
      let y = 100;
      doc.line(20, y-5, 190, y-5); // Top line
      headers.forEach((header, i) => {
        doc.text(header, 20 + (i * 34), y);
      });
      doc.line(20, y+5, 190, y+5); // Bottom line

      // Table Content
      y += 20;
      students.forEach((student) => {
        if (y > 250) { // Check if we need a new page
          doc.addPage();
          y = 40;
        }
        doc.text(student.regNo, 20, y);
        doc.text(student.name, 54, y);
        doc.text(student.department, 88, y);
        doc.text(student.status || "-", 122, y);
        doc.line(156, y, 190, y); // Signature line
        y += 15;
      });

      // Teacher's Signature
      y += 20;
      doc.text("Teacher's Signature: _________________", 20, y);
      
      // Save PDF
      doc.save(`attendance-${selectedExamSession.subject}-${selectedExamSession.date}.pdf`);
      
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
                      <TableHead>Status</TableHead>
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.status === "present"
                                ? "bg-green-100 text-green-800"
                                : student.status === "absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {student.status
                              ? student.status.charAt(0).toUpperCase() +
                                student.status.slice(1)
                              : "Not marked"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant={
                                student.status === "present" ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => markAttendance(student.id, "present")}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Present
                            </Button>
                            <Button
                              variant={
                                student.status === "absent" ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => markAttendance(student.id, "absent")}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={downloadAttendanceSheet}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Attendance
                </Button>
                <Button onClick={handleSaveAttendance}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExamAttendance;
