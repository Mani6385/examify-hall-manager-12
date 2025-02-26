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
import { BookOpen, Loader2, Pencil, Trash2, Users, GraduationCap, CalendarDays } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

interface Class {
  id: string;
  name: string;
  section: string;
  capacity: string;
  department: string | null;
}

const Classes = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    capacity: "",
    department: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch classes with related data
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Class[];
    },
  });

  // Fetch teachers
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

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Get teachers by department
  const getTeachersForDepartment = (department: string) => {
    return teachers.filter(teacher => teacher.department === department);
  };

  // Get subjects by department
  const getSubjectsForDepartment = (department: string) => {
    return subjects.filter(subject => subject.department === department);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedClass) {
        // Edit existing class
        const { error } = await supabase
          .from('classes')
          .update(formData)
          .eq('id', selectedClass.id);

        if (error) throw error;

        toast({
          title: "Class Updated",
          description: "Class information has been updated successfully.",
        });
        setIsEditDialogOpen(false);
      } else {
        // Add new class
        const { error } = await supabase
          .from('classes')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Class Added",
          description: "New class has been added successfully.",
        });
        setIsAddDialogOpen(false);
      }

      // Refresh the classes data
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setFormData({ name: "", section: "", capacity: "", department: "" });
      setSelectedClass(null);
    } catch (error) {
      console.error('Error saving class:', error);
      toast({
        title: "Error",
        description: "There was an error saving the class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      section: classItem.section,
      capacity: classItem.capacity,
      department: classItem.department,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Class Deleted",
        description: "Class has been removed successfully.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: "There was an error deleting the class. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Classes</h2>
            <p className="text-muted-foreground mt-2">
              Manage class records and room assignments
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
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
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
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
                  Add Class
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((classItem) => {
            const departmentTeachers = getTeachersForDepartment(classItem.department || '');
            const departmentSubjects = getSubjectsForDepartment(classItem.department || '');
            
            return (
              <div key={classItem.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{classItem.name}</h3>
                    <p className="text-sm text-muted-foreground">Section {classItem.section}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(classItem)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {classItem.capacity}</span>
                  </div>
                  {classItem.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4" />
                      <span>Department: {classItem.department}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Teachers
                    </h4>
                    <ul className="text-sm space-y-1">
                      {departmentTeachers.map(teacher => (
                        <li key={teacher.id} className="text-muted-foreground">
                          {teacher.name} - {teacher.subject}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subjects
                    </h4>
                    <ul className="text-sm space-y-1">
                      {departmentSubjects.map(subject => (
                        <li key={subject.id} className="text-muted-foreground">
                          {subject.name} ({subject.code})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-2">
                  <Link to="/exams">
                    <Button variant="outline" size="sm">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      View Exams
                    </Button>
                  </Link>
                  <Link to="/seating">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-1" />
                      Seating Plan
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Class Name</Label>
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
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
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
              <Button type="submit" className="w-full">
                Update Class
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Classes;
