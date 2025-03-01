
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { UserPlus, Pencil, Trash2, Search, FileSpreadsheet, FileUp, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import * as XLSX from 'xlsx';

type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

const Students = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    roll_number: "",
    name: "",
    signature: "",
    department: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for students
  const { data: students = [], isLoading } = useQuery({
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

  // Query for teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const getDepartmentTeachers = (department: string) => {
    return teachers.filter(teacher => teacher.department === department);
  };

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (newStudent: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student Added",
        description: "New student has been added successfully.",
      });
      setIsAddDialogOpen(false);
      setFormData({
        roll_number: "",
        name: "",
        signature: "",
        department: "",
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

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Student> & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      setFormData({
        roll_number: "",
        name: "",
        signature: "",
        department: "",
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

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setFormData({
      roll_number: student.roll_number,
      name: student.name,
      signature: student.signature || "",
      department: student.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteStudentMutation.mutate(id);
  };

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Updated file upload handler with duplicate check
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as Array<{
          roll_number: string;
          name: string;
          department: string;
          signature?: string;
        }>;

        const formattedData = data.map(row => ({
          roll_number: String(row.roll_number).trim(),
          name: String(row.name).trim(),
          department: String(row.department).trim(),
          signature: row.signature ? String(row.signature) : null,
        }));

        // Check for duplicates within the imported data
        const rollNumbers = formattedData.map(s => s.roll_number);
        const duplicatesInFile = rollNumbers.filter((item, index) => rollNumbers.indexOf(item) !== index);
        
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
    reader.readAsBinaryString(file);
  };

  // Updated bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('students')
        .insert(students)
        .select();
      
      if (error) throw error;
      return data;
    },
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

  // New mutation for updating existing students during import
  const bulkUpdateMutation = useMutation({
    mutationFn: async (students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]) => {
      // For each student that already exists, we need to update them
      const promises = students.map(async (student) => {
        const { error } = await supabase
          .from('students')
          .update({
            name: student.name,
            department: student.department,
            signature: student.signature
          })
          .eq('roll_number', student.roll_number);
        
        if (error) throw error;
      });
      
      await Promise.all(promises);
      return students;
    },
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

  // New state for handling import confirmation
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<{
    newStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
    updatedStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
  }>({
    newStudents: [],
    updatedStudents: []
  });

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
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import Students
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Students from Excel</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file with student details. Make sure roll numbers are unique.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <FileUp className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary hover:text-primary/90">Upload a file</span>
                        <Input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                        />
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Excel files only (.xlsx, .xls)
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>The Excel file should have the following columns:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>roll_number (required)</li>
                      <li>name (required)</li>
                      <li>department (required)</li>
                      <li>signature (optional)</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Student Import</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p>Your import file contains {importData.updatedStudents.length} students with roll numbers that already exist in the database.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Do you want to update the existing students with the new information?
                      </p>
                    </div>
                  </div>
                  
                  {importData.updatedStudents.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importData.updatedStudents.map((student) => (
                            <TableRow key={student.roll_number}>
                              <TableCell>{student.roll_number}</TableCell>
                              <TableCell>{student.name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowImportConfirm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmImport}>
                      Update and Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roll_number">Roll Number</Label>
                    <Input
                      id="roll_number"
                      value={formData.roll_number}
                      onChange={(e) =>
                        setFormData({ ...formData, roll_number: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Student Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {selectedStudent ? "Update Student" : "Add Student"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Department Teachers</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const departmentTeachers = getDepartmentTeachers(student.department || '');
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.roll_number}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {departmentTeachers.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {departmentTeachers.map(teacher => (
                                <li key={teacher.id}>
                                  {teacher.name} ({teacher.subject})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground">No teachers assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Students;
