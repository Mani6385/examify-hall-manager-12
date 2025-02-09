import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

interface Seat {
  id: number;
  seatNo: string;
  studentName: string | null;
  regNo: string | null;
  department: string | null;
}

const Seating = () => {
  const [selectedDept1, setSelectedDept1] = useState<string>("");
  const [selectedDept2, setSelectedDept2] = useState<string>("");
  const [startRegNo1, setStartRegNo1] = useState("");
  const [endRegNo1, setEndRegNo1] = useState("");
  const [startRegNo2, setStartRegNo2] = useState("");
  const [endRegNo2, setEndRegNo2] = useState("");
  const [rows, setRows] = useState(5);
  const [cols, setColumns] = useState(6);
  const [seats, setSeats] = useState<Seat[]>([]);
  const { toast } = useToast();

  // Mock department data
  const departments = [
    { id: "1", name: "Computer Science" },
    { id: "2", name: "Electronics" },
    { id: "3", name: "Mechanical" },
  ];

  const generateStudentList = (
    startReg: string,
    endReg: string,
    department: string,
    prefix: string
  ) => {
    const students = [];
    const start = parseInt(startReg);
    const end = parseInt(endReg);
    let seatNumber = 1;
    
    for (let i = start; i <= end; i++) {
      students.push({
        name: `${department} Student`,
        regNo: i.toString().padStart(3, '0'),
        department: department,
        seatNo: `${prefix}${seatNumber++}`
      });
    }
    return students;
  };

  const generateSeating = () => {
    if (!selectedDept1 || !selectedDept2 || !startRegNo1 || !endRegNo1 || !startRegNo2 || !endRegNo2) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Generate student lists for both departments with their respective prefixes
    const dept1Students = generateStudentList(startRegNo1, endRegNo1, selectedDept1, 'A');
    const dept2Students = generateStudentList(startRegNo2, endRegNo2, selectedDept2, 'B');

    // Create an array of all seats
    const totalSeats = rows * cols;
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      seatNo: '',
      studentName: null,
      regNo: null,
      department: null,
    }));

    // Arrange students alternately from both departments
    const allStudents = [];
    const maxLength = Math.max(dept1Students.length, dept2Students.length);
    for (let i = 0; i < maxLength; i++) {
      if (dept1Students[i]) allStudents.push(dept1Students[i]);
      if (dept2Students[i]) allStudents.push(dept2Students[i]);
    }

    // Assign students to seats
    const assignedSeats = emptySeats.map((seat, index) => ({
      ...seat,
      seatNo: allStudents[index]?.seatNo || '',
      studentName: allStudents[index]?.name || null,
      regNo: allStudents[index]?.regNo || null,
      department: allStudents[index]?.department || null,
    }));

    // Save seating arrangement to localStorage for Reports
    const seatingData = {
      dept1: selectedDept1,
      dept2: selectedDept2,
      startRegNo1,
      endRegNo1,
      startRegNo2,
      endRegNo2,
      timestamp: new Date().toISOString(),
      seats: assignedSeats
    };
    localStorage.setItem('seatingArrangement', JSON.stringify(seatingData));

    setSeats(assignedSeats);
    toast({
      title: "Success",
      description: "Seating arrangement generated successfully",
    });
  };

  const rotateStudents = (direction: 'left' | 'right') => {
    if (seats.length === 0) return;

    const newSeats = [...seats];
    if (direction === 'right') {
      const lastSeat = newSeats[newSeats.length - 1];
      for (let i = newSeats.length - 1; i > 0; i--) {
        newSeats[i] = newSeats[i - 1];
      }
      newSeats[0] = lastSeat;
    } else {
      const firstSeat = newSeats[0];
      for (let i = 0; i < newSeats.length - 1; i++) {
        newSeats[i] = newSeats[i + 1];
      }
      newSeats[newSeats.length - 1] = firstSeat;
    }

    setSeats(newSeats);
    toast({
      title: "Success",
      description: `Students rotated ${direction}`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exam Hall Seating Arrangement</h2>
          <p className="text-muted-foreground mt-2">
            Generate and manage exam hall seating arrangements for multiple departments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department 1 Configuration */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Department 1 (A Series)</h3>
            <Select value={selectedDept1} onValueChange={setSelectedDept1}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Start Reg No"
                value={startRegNo1}
                onChange={(e) => setStartRegNo1(e.target.value)}
              />
              <Input
                placeholder="End Reg No"
                value={endRegNo1}
                onChange={(e) => setEndRegNo1(e.target.value)}
              />
            </div>
          </div>

          {/* Department 2 Configuration */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Department 2 (B Series)</h3>
            <Select value={selectedDept2} onValueChange={setSelectedDept2}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Start Reg No"
                value={startRegNo2}
                onChange={(e) => setStartRegNo2(e.target.value)}
              />
              <Input
                placeholder="End Reg No"
                value={endRegNo2}
                onChange={(e) => setEndRegNo2(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Button onClick={generateSeating}>
            <Grid3X3 className="mr-2 h-4 w-4" />
            Generate Seating
          </Button>

          <Button
            variant="outline"
            onClick={() => rotateStudents('left')}
            disabled={seats.length === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Rotate Left
          </Button>

          <Button
            variant="outline"
            onClick={() => rotateStudents('right')}
            disabled={seats.length === 0}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Rotate Right
          </Button>

          <Button
            variant="outline"
            onClick={() => setSeats([])}
            disabled={seats.length === 0}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {seats.length > 0 && (
          <div className="grid gap-4" style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}>
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`p-4 rounded-lg border ${
                  seat.studentName
                    ? seat.department === selectedDept1
                      ? "bg-blue-100 border-blue-200"
                      : "bg-green-100 border-green-200"
                    : "bg-muted border-muted-foreground/20"
                } flex flex-col items-center justify-center text-center min-h-[120px] text-sm`}
              >
                {seat.studentName ? (
                  <>
                    <span className="font-bold text-lg mb-1">{seat.seatNo}</span>
                    <span className="font-medium">{seat.studentName}</span>
                    <span className="text-xs text-gray-600">Reg: {seat.regNo}</span>
                    <span className="text-xs text-gray-500">{seat.department}</span>
                  </>
                ) : (
                  "Empty"
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Seating;
