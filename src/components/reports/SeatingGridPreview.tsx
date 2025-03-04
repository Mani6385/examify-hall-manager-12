
import { useState } from 'react';
import { SeatingArrangement } from '@/utils/reportUtils';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Grid } from "lucide-react";

interface SeatingGridPreviewProps {
  arrangement: SeatingArrangement;
}

export function SeatingGridPreview({ arrangement }: SeatingGridPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Map of seat assignments for quick lookup
  const assignmentMap = new Map();
  arrangement.seating_assignments.forEach(assignment => {
    if (assignment.seat_no && assignment.seat_no.trim() !== '') {
      assignmentMap.set(assignment.seat_no, assignment);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Grid className="h-4 w-4" />
          Grid View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogTitle>Room {arrangement.room_no} - Seating Grid</DialogTitle>
        
        <div className="p-4">
          <div 
            className="grid gap-2 border rounded-lg p-4 overflow-auto" 
            style={{ 
              gridTemplateColumns: `repeat(${arrangement.columns}, minmax(120px, 1fr))`,
              minWidth: arrangement.columns * 120,
            }}
          >
            {Array.from({ length: arrangement.rows * arrangement.columns }).map((_, index) => {
              const row = Math.floor(index / arrangement.columns);
              const col = index % arrangement.columns;
              
              // Calculate seat number
              const rowLabel = String.fromCharCode(65 + row); // A, B, C, ...
              const colLabel = col + 1;
              const seatNo = `${rowLabel}${colLabel}`;
              
              // Get assignment for this seat
              const assignment = assignmentMap.get(seatNo);
              
              return (
                <div 
                  key={seatNo} 
                  className={`border rounded-md p-2 ${assignment ? 'bg-primary/5' : 'bg-gray-50'}`}
                >
                  <div className="text-sm font-bold">{seatNo}</div>
                  <div className="text-xs font-medium">
                    {assignment ? assignment.department : 'Empty'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {assignment?.reg_no || ''}
                  </div>
                  <div className="text-xs truncate">
                    {assignment?.student_name || ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
