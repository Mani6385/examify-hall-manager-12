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
import { UserPlus, Pencil, Trash2, Search, FileSpreadsheet, FileUp } from "lucide-react";
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
    assigned_teacher_id: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          roll_number: String(row.roll_number),
          name: String(row.name),
          department: String(row.department),
          signature: row.signature ? String(row.signature) : null,
        }));

        bulkImportMutation.mutate(formattedData);
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
        description: "Students have been imported successfully.",
      });
      setIsImportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        assigned_teacher_id: "",
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
        assigned_teacher_id: "",
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
      assigned_teacher_id: student.assigned_teacher_id || "",
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
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Assigned Teacher</Label>
                    <Select
                      value={formData.assigned_teacher_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_teacher_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers
                          .filter(teacher => teacher.department === formData.department)
                          .map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} - {teacher.subject}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Add Student
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-roll_number">Roll Number</Label>
                <Input
                  id="edit-roll_number"
                  value={formData.roll_number}
                  onChange={(e) =>
                    setFormData({ ...formData, roll_number: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Student Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-teacher">Assigned Teacher</Label>
                <Select
                  value={formData.assigned_teacher_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_teacher_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter(teacher => teacher.department === formData.department)
                      .map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.subject}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Update Student
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Teachers</TableHead>
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
