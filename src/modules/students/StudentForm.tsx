
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/integrations/supabase/types";

type Student = Database['public']['Tables']['students']['Row'];

interface StudentFormProps {
  student: Student | null;
  onSubmit: (formData: {
    roll_number: string;
    name: string;
    signature: string;
    department: string;
  }) => void;
}

export const StudentForm = ({ student, onSubmit }: StudentFormProps) => {
  const [formData, setFormData] = useState({
    roll_number: student?.roll_number || "",
    name: student?.name || "",
    signature: student?.signature || "",
    department: student?.department || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
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
        {student ? "Update Student" : "Add Student"}
      </Button>
    </form>
  );
};
