
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seat } from "@/utils/studentUtils";
import { DepartmentConfig } from "@/utils/departmentUtils";
import { VisualSeatingChart } from "./VisualSeatingChart";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SeatingGridProps {
  seats: Seat[];
  setSeats: (seats: Seat[]) => void;
  generateSeating: () => void;
  rotateStudents: (direction: 'left' | 'right') => void;
  departments: DepartmentConfig[];
  rows: number;
  cols: number;
}

export const SeatingGrid = ({
  seats,
  setSeats,
  generateSeating,
  rotateStudents,
  departments,
  rows,
  cols,
}: SeatingGridProps) => {
  const [editingSeatId, setEditingSeatId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedRegNo, setEditedRegNo] = useState("");
  const [editedDepartment, setEditedDepartment] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (seat: Seat) => {
    setEditingSeatId(seat.id);
    setEditedName(seat.studentName || "");
    setEditedRegNo(seat.regNo || "");
    setEditedDepartment(seat.department || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingSeatId === null) return;
    
    const updatedSeats = seats.map(seat => 
      seat.id === editingSeatId 
        ? {
            ...seat,
            studentName: editedName || null,
            regNo: editedRegNo || null,
            department: editedDepartment || null
          }
        : seat
    );
    
    setSeats(updatedSeats);
    setIsEditDialogOpen(false);
    setEditingSeatId(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 items-center">
        <Button 
          onClick={generateSeating} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          <Grid3X3 className="mr-2 h-4 w-4" />
          Generate Seating
        </Button>

        <Button
          variant="outline"
          onClick={() => rotateStudents('left')}
          disabled={seats.length === 0}
          className="hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Rotate Left
        </Button>

        <Button
          variant="outline"
          onClick={() => rotateStudents('right')}
          disabled={seats.length === 0}
          className="hover:bg-blue-50 transition-colors"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Rotate Right
        </Button>

        <Button
          variant="outline"
          onClick={() => setSeats([])}
          disabled={seats.length === 0}
          className="hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {seats.length > 0 && (
        <>
          <div className="my-8">
            <VisualSeatingChart 
              seats={seats} 
              rows={rows} 
              cols={cols} 
              departments={departments} 
            />
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Student List</h3>
          <div className="grid gap-4" style={{
            gridTemplateColumns: `repeat(${Math.sqrt(seats.length)}, minmax(0, 1fr))`,
          }}>
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`p-4 rounded-lg shadow-sm transition-all hover:shadow-md ${
                  seat.studentName
                    ? departments.find(d => d.department === seat.department)?.department === seat.department
                      ? `bg-gradient-to-br ${
                          departments.findIndex(d => d.department === seat.department) % 5 === 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 
                          departments.findIndex(d => d.department === seat.department) % 5 === 1 ? 'from-green-50 to-green-100 border-green-200' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 2 ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 3 ? 'from-purple-50 to-purple-100 border-purple-200' :
                          'from-pink-50 to-pink-100 border-pink-200'
                        }`
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">{seat.seatNo || 'Empty'}</div>
                  {seat.studentName && (
                    <>
                      <div className="text-sm text-gray-600 truncate">{seat.studentName}</div>
                      <div className="text-xs text-gray-500">Reg: {seat.regNo}</div>
                      <div className="text-xs text-gray-400 truncate mt-1">{seat.department}</div>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(seat)}
                    className="mt-2 w-full h-7"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Edit Seat Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Seat Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student Name</label>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Student Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Registration Number</label>
                  <Input
                    value={editedRegNo}
                    onChange={(e) => setEditedRegNo(e.target.value)}
                    placeholder="Registration Number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={editedDepartment} onValueChange={setEditedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        dept.department && (
                          <SelectItem key={dept.id} value={dept.department}>
                            {dept.department}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
};
