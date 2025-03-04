
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Student = Database['public']['Tables']['students']['Row'];

interface ImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImportDialog = ({
  isOpen,
  onOpenChange,
  onFileUpload,
}: ImportDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                  onChange={onFileUpload}
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
  );
};
