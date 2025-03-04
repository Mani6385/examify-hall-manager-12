
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
  getDepartmentTeachers: (department: string) => Teacher[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export const StudentList = ({
  students,
  isLoading,
  getDepartmentTeachers,
  onEdit,
  onDelete
}: StudentListProps) => {
  return (
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
                        onClick={() => onEdit(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(student.id)}
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
  );
};
