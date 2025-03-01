
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
import { useState, useEffect } from "react";
import { Save, FileText, Signature, Search, UserCheck, UsersRound } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun } from 'docx';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Student = Database['public']['Tables']['students']['Row'];
type ExamWithCenter = Database['public']['Tables']['exams']['Row'] & {
  exam_centers: Database['public']['Tables']['exam_centers']['Row'] | null;
};
type ExamAttendance = Database['public']['Tables']['exam_attendance']['Row'];

const ExamAttendance = () => {
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam sessions with center details
  const { data: examSessions = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          exam_centers (
            id,
            name,
            code
          )
        `)
        .order('date');
      
      if (error) throw error;
      return data as ExamWithCenter[];
    },
  });

  // Get unique centers from exam sessions
  const examCenters = examSessions
    .filter(exam => exam.exam_centers)
    .map(exam => exam.exam_centers)
    .filter((center, index, self) => 
      center && self.findIndex(c => c?.id === center.id) === index
    );

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch exam attendance records for selected exam
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', selectedExam],
    queryFn: async () => {
      if (!selectedExam) return [];
      const { data, error } = await supabase
        .from('exam_attendance')
        .select('*')
        .eq('exam_id', selectedExam);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExam,
  });

  // Add query for seating arrangements
  const { data: seatingArrangements = [] } = useQuery({
    queryKey: ['seatingArrangements', selectedExam],
    queryFn: async () => {
      if (!selectedExam) return [];
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select(`
          *,
          seating_assignments (
            seat_no,
            student_name,
            reg_no,
            department
          )
        `)
        .eq('exam_id', selectedExam);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExam,
  });

  // Filter exams by center
  useEffect(() => {
    if (selectedCenter && examSessions.length > 0) {
      const centerExams = examSessions.filter(
        exam => exam.exam_centers?.id === selectedCenter
      );
      
      if (centerExams.length > 0 && (!selectedExam || 
          !centerExams.some(exam => exam.id === selectedExam))) {
        setSelectedExam(centerExams[0].id);
      }
    }
  }, [selectedCenter, examSessions, selectedExam]);

  // Add mutation for updating attendance with seating info
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, seatNumber }: { studentId: string; seatNumber: string }) => {
      const { data, error } = await supabase
        .from('exam_attendance')
        .upsert([{
          exam_id: selectedExam,
          student_id: studentId,
          seat_number: seatNumber
        }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedExam] });
      toast({
        title: "Success",
        description: "Attendance and seating updated successfully",
      });
    },
  });

  // Function to find seat number for a student
  const findStudentSeatNumber = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    for (const arrangement of seatingArrangements) {
      const assignment = arrangement.seating_assignments?.find(
        assign => assign.reg_no === student.roll_number
      );
      if (assignment) {
        return assignment.seat_no;
      }
    }
    return null;
  };

  // Single implementation of markAttendance with seating information
  const markAttendance = async (studentId: string) => {
    if (!selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam session first.",
        variant: "destructive",
      });
      return;
    }

    const seatNumber = findStudentSeatNumber(studentId);
    if (!seatNumber) {
      toast({
        title: "Warning",
        description: "No seating assignment found for this student.",
      });
    }

    updateAttendanceMutation.mutate({ 
      studentId,
      seatNumber: seatNumber || 'Not Assigned'
    });
  };

  // Batch mark attendance for all students with seat assignments
  const markAllAttendance = async () => {
    if (!selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam session first.",
        variant: "destructive",
      });
      return;
    }

    // Get all students with seat assignments
    const studentsWithSeats: { studentId: string, seatNumber: string }[] = [];
    
    students.forEach(student => {
      const seatNumber = findStudentSeatNumber(student.id);
      if (seatNumber) {
        studentsWithSeats.push({
          studentId: student.id,
          seatNumber
        });
      }
    });

    if (studentsWithSeats.length === 0) {
      toast({
        title: "Warning",
        description: "No students have seating assignments for this exam.",
      });
      return;
    }

    // Mark attendance for each student
    const promises = studentsWithSeats.map(({ studentId, seatNumber }) => 
      updateAttendanceMutation.mutateAsync({ studentId, seatNumber })
    );

    Promise.all(promises)
      .then(() => {
        toast({
          title: "Success",
          description: `Marked attendance for ${studentsWithSeats.length} students`,
        });
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Failed to mark attendance for all students",
          variant: "destructive",
        });
      });
  };

  // Update teacher signature mutation
  const updateTeacherSignatureMutation = useMutation({
    mutationFn: async ({ teacherId, signature }: { teacherId: string; signature: string }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update({ signature })
        .eq('id', teacherId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({
        title: "Success",
        description: "Teacher signature updated successfully.",
      });
    },
  });

  const addStudentSignature = (studentId: string, signature: string) => {
    updateAttendanceMutation.mutate({ studentId, seatNumber: signature });
  };

  const addTeacherSignature = (teacherId: string, signature: string) => {
    updateTeacherSignatureMutation.mutate({ teacherId, signature });
  };

  const handleSaveAttendance = () => {
    if (!selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam session first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Attendance Saved",
      description: "Exam attendance has been recorded successfully.",
    });
  };

  // Add mutation for deleting attendance records
  const deleteAttendanceMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('exam_attendance')
        .delete()
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedExam] });
      toast({
        title: "Success",
        description: "Attendance record removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove attendance record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (studentId: string) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    if (!record) return;
    
    deleteAttendanceMutation.mutate(record.id);
  };

  // Add function to check if student is present
  const isStudentPresent = (studentId: string) => {
    return attendanceRecords.some(record => record.student_id === studentId);
  };

  // Generate attendance data for reports
  const generateAttendanceData = () => {
    const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);
    if (!selectedExamSession) return null;

    const attendanceData = students.map(student => {
      const attendanceRecord = attendanceRecords.find(record => record.student_id === student.id);
      return {
        regNo: student.roll_number,
        name: student.name,
        signature: student.signature || '_____________',
        isPresent: !!attendanceRecord,
        seatNumber: attendanceRecord?.seat_number || findStudentSeatNumber(student.id) || '-'
      };
    });

    return {
      examSession: selectedExamSession,
      attendance: attendanceData
    };
  };

  // Download as Excel
  const downloadAttendanceSheet = () => {
    const data = generateAttendanceData();
    if (!data) {
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
        ['Center Name:', data.examSession.exam_centers?.name],
        ['Center Code:', data.examSession.exam_centers?.code],
        ['Room:', data.examSession.venue],
        ['Subject:', data.examSession.subject],
        ['Date:', data.examSession.date],
        ['Time:', data.examSession.start_time],
        [],
        ['Registration No', 'Name', 'Present', 'Seat Number', 'Student Signature'],
        ...data.attendance.map(student => [
          student.regNo,
          student.name,
          student.isPresent ? 'Yes' : 'No',
          student.seatNumber,
          student.signature
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance-${data.examSession.subject}-${data.examSession.date}.xlsx`);

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

  // Generate PDF
  const generatePDF = () => {
    const data = generateAttendanceData();
    if (!data) {
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
      doc.text(`Center Name: ${data.examSession.exam_centers?.name}`, 15, 30);
      doc.text(`Center Code: ${data.examSession.exam_centers?.code}`, 15, 37);
      doc.text(`Room: ${data.examSession.venue}`, 15, 44);
      doc.text(`Subject: ${data.examSession.subject}`, 15, 51);
      doc.text(`Date: ${data.examSession.date}`, 15, 58);
      doc.text(`Time: ${data.examSession.start_time}`, 15, 65);

      const headers = [["Reg No", "Name", "Present", "Seat Number", "Student Signature"]];
      
      const tableData = data.attendance.map(student => [
        student.regNo,
        student.name,
        student.isPresent ? 'Yes' : 'No',
        student.seatNumber,
        student.signature
      ]);

      (doc as any).autoTable({
        head: headers,
        body: tableData,
        startY: 75,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.text("Teacher Signature: _________________", 15, doc.internal.pageSize.height - 20);

      doc.save(`attendance-${data.examSession.subject}-${data.examSession.date}.pdf`);

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

  // Generate Word
  const generateWord = async () => {
    const data = generateAttendanceData();
    if (!data) {
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
              children: [new TextRun({ text: `Center Name: ${data.examSession.exam_centers?.name}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Center Code: ${data.examSession.exam_centers?.code}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Room: ${data.examSession.venue}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Subject: ${data.examSession.subject}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Date: ${data.examSession.date}` })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `Time: ${data.examSession.start_time}` })],
            }),
            new Paragraph({ children: [] }),
            new DocxTable({
              rows: [
                new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reg No", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Present", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Seat Number", bold: true })] })] }),
                    new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Student Signature", bold: true })] })] }),
                  ],
                }),
                ...data.attendance.map(
                  student => new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.regNo })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.name })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.isPresent ? 'Yes' : 'No' })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.seatNumber })] })] }),
                      new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.signature })] })] }),
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
      link.download = `attendance-${data.examSession.subject}-${data.examSession.date}.docx`;
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

  // Get filtered students
  const getFilteredStudents = () => {
    return students.filter(student => {
      // Apply search filter
      const matchesSearch = searchQuery === "" || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply attendance filter
      if (activeTab === "present") {
        return matchesSearch && isStudentPresent(student.id);
      } else if (activeTab === "absent") {
        return matchesSearch && !isStudentPresent(student.id);
      }
      
      // "all" tab
      return matchesSearch;
    });
  };

  const filteredStudents = getFilteredStudents();
  const selectedExamSession = examSessions.find((exam) => exam.id === selectedExam);
  
  // Stats for attendance
  const totalStudents = filteredStudents.length;
  const presentStudents = filteredStudents.filter(student => 
    isStudentPresent(student.id)
  ).length;
  const absentStudents = totalStudents - presentStudents;
  const attendanceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Exam Center</label>
              <Select
                value={selectedCenter}
                onValueChange={setSelectedCenter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam center" />
                </SelectTrigger>
                <SelectContent>
                  {examCenters.map((center) => (
                    center && <SelectItem key={center.id} value={center.id}>
                      {center.name} ({center.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Exam Session</label>
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam session" />
                </SelectTrigger>
                <SelectContent>
                  {examSessions
                    .filter(exam => !selectedCenter || 
                      exam.exam_centers?.id === selectedCenter)
                    .map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.subject} - {exam.date} ({exam.start_time})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
                  <p className="font-medium">{selectedExamSession.start_time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium">{selectedExamSession.venue}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Center Name</p>
                  <p className="font-medium">{selectedExamSession.exam_centers?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Center Code</p>
                  <p className="font-medium">{selectedExamSession.exam_centers?.code}</p>
                </div>
              </div>
            </div>
          )}

          {selectedExam && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStudents}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{presentStudents}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Absent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{absentStudents}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 w-full">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Tabs 
                    defaultValue="all" 
                    className="w-full"
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="present">Present</TabsTrigger>
                      <TabsTrigger value="absent">Absent</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Button
                  onClick={markAllAttendance}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Seat Number</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStudents || isLoadingAttendance ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No students found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => {
                        const attendanceRecord = attendanceRecords.find(
                          record => record.student_id === student.id
                        );
                        const isPresent = isStudentPresent(student.id);
                        const seatNumber = findStudentSeatNumber(student.id);

                        return (
                          <TableRow key={student.id}>
                            <TableCell>{student.roll_number}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.department}</TableCell>
                            <TableCell>
                              <Badge variant={isPresent ? "success" : "destructive"} className="h-6">
                                {isPresent ? 'Present' : 'Absent'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {seatNumber || attendanceRecord?.seat_number || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {!isPresent ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAttendance(student.id)}
                                  >
                                    Mark Present
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(student.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Teacher Signature:</span>
                  <span className="border-b border-gray-300 w-40">
                    {selectedExamSession.subject || "_____________"}
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
