
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type ExamCenter = Database['public']['Tables']['exam_centers']['Row'];

export function ManageExamCenters() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<ExamCenter | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam centers
  const { data: examCenters = [], isLoading } = useQuery({
    queryKey: ['examCenters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_centers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Add exam center mutation
  const addCenterMutation = useMutation({
    mutationFn: async (newCenter: Omit<ExamCenter, 'id' | 'created_at' | 'updated_at'>) => {
      // First check if code already exists
      const { data: existingCenter } = await supabase
        .from('exam_centers')
        .select('code')
        .eq('code', newCenter.code)
        .single();

      if (existingCenter) {
        throw new Error('An exam center with this code already exists');
      }

      const { data, error } = await supabase
        .from('exam_centers')
        .insert([newCenter])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('An exam center with this code already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCenters'] });
      toast({
        title: "Exam Center Added",
        description: "New exam center has been added successfully.",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", code: "", department: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update exam center mutation
  const updateCenterMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ExamCenter> & { id: string }) => {
      // Check if code exists and belongs to a different center
      if (updateData.code) {
        const { data: existingCenter } = await supabase
          .from('exam_centers')
          .select('id, code')
          .eq('code', updateData.code)
          .neq('id', id)
          .single();

        if (existingCenter) {
          throw new Error('An exam center with this code already exists');
        }
      }

      const { data, error } = await supabase
        .from('exam_centers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('An exam center with this code already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCenters'] });
      toast({
        title: "Exam Center Updated",
        description: "Exam center has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedCenter(null);
      setFormData({ name: "", code: "", department: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete exam center mutation
  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_centers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCenters'] });
      toast({
        title: "Exam Center Deleted",
        description: "Exam center has been deleted successfully.",
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
    if (selectedCenter) {
      updateCenterMutation.mutate({
        id: selectedCenter.id,
        ...formData,
      });
    } else {
      addCenterMutation.mutate(formData);
    }
  };

  const handleEdit = (center: ExamCenter) => {
    setSelectedCenter(center);
    setFormData({
      name: center.name,
      code: center.code,
      department: center.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCenterMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Exam Centers</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Center
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exam Center</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Center Name</Label>
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
                <Label htmlFor="code">Center Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
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
                  placeholder="Enter department name"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Center
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exam Center</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Center Name</Label>
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
              <Label htmlFor="edit-code">Center Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
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
                placeholder="Enter department name"
              />
            </div>
            <Button type="submit" className="w-full">
              Update Center
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Center Name</TableHead>
              <TableHead>Center Code</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : examCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No exam centers found. Add your first center to get started.
                </TableCell>
              </TableRow>
            ) : (
              examCenters.map((center) => (
                <TableRow key={center.id}>
                  <TableCell>{center.name}</TableCell>
                  <TableCell>{center.code}</TableCell>
                  <TableCell>{center.department || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(center)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(center.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
