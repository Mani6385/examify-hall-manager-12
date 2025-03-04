
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { UserPlus, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { StudentList } from "@/modules/students/StudentList";
import { StudentForm } from "@/modules/students/StudentForm";
import { ImportDialog } from "@/modules/students/ImportDialog";
import { ImportConfirmDialog } from "@/modules/students/ImportConfirmDialog";
import * as StudentService from "@/modules/students/StudentService";

type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

const Students = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: StudentService.fetchStudents,
  });

  // Query for teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: StudentService.fetchTeachers,
  });

  const getDepartmentTeachers = (department: string) => {
    return teachers.filter(teacher => teacher.department === department);
  };

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: StudentService.addStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student Added",
        description: "New student has been added successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: StudentService.updateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: StudentService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student Deleted",
        description: "Student has been removed successfully.",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: StudentService.bulkImportStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Students Imported",
        description: "New students have been imported successfully.",
      });
      setIsImportDialogOpen(false);
      setShowImportConfirm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: StudentService.bulkUpdateStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Students Updated",
        description: "Existing students have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submit handler
  const handleSubmit = (formData: {
    roll_number: string;
    name: string;
    signature: string;
    department: string;
  }) => {
    if (selectedStudent) {
      updateStudentMutation.mutate({
        id: selectedStudent.id,
        ...formData,
      });
    } else {
      addStudentMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteStudentMutation.mutate(id);
  };

  // New state for handling import confirmation
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<{
    newStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
    updatedStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
  }>({
    newStudents: [],
    updatedStudents: []
  });

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { formattedData, duplicatesInFile } = await StudentService.parseExcelFile(event);
      
      if (duplicatesInFile.length > 0) {
        toast({
          title: "Duplicate Roll Numbers",
          description: `Your import file contains duplicate roll numbers: ${duplicatesInFile.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Check against existing students in database
      const existingRollNumbers = students.map(s => s.roll_number);
      const newStudents = [];
      const updatedStudents = [];

      for (const student of formattedData) {
        if (existingRollNumbers.includes(student.roll_number)) {
          updatedStudents.push(student);
        } else {
          newStudents.push(student);
        }
      }

      if (updatedStudents.length > 0) {
        setImportData({
          newStudents,
          updatedStudents
        });
        setShowImportConfirm(true);
      } else {
        // If no duplicates, proceed with import directly
        bulkImportMutation.mutate(formattedData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse the Excel file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  // Function to handle confirmed import
  const handleConfirmImport = () => {
    if (importData.newStudents.length > 0) {
      bulkImportMutation.mutate(importData.newStudents);
    }
    
    if (importData.updatedStudents.length > 0) {
      bulkUpdateMutation.mutate(importData.updatedStudents);
    }
    
    setShowImportConfirm(false);
    setIsImportDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Students</h2>
            <p className="text-muted-foreground mt-2">
              Manage student records and information
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Students
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <StudentForm student={null} onSubmit={handleSubmit} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <StudentList 
          students={students}
          isLoading={isLoading}
          getDepartmentTeachers={getDepartmentTeachers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            <StudentForm student={selectedStudent} onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <ImportDialog 
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onFileUpload={handleFileUpload}
        />

        {/* Import Confirm Dialog */}
        <ImportConfirmDialog 
          isOpen={showImportConfirm}
          onOpenChange={setShowImportConfirm}
          importData={importData}
          onConfirm={handleConfirmImport}
        />
      </div>
    </Layout>
  );
};

export default Students;
