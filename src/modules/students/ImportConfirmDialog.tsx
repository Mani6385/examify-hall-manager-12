
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type Student = Database['public']['Tables']['students']['Row'];

interface ImportConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  importData: {
    newStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
    updatedStudents: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
  };
  onConfirm: () => void;
}

export const ImportConfirmDialog = ({
  isOpen,
  onOpenChange,
  importData,
  onConfirm,
}: ImportConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>
              Update and Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
