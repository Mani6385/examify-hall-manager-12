
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
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

interface DepartmentConfig {
  id: string;
  department: string;
  startRegNo: string;
  endRegNo: string;
  prefix: string;
}

interface Seat {
  id: number;
  seatNo: string;
  studentName: string | null;
  regNo: string | null;
  department: string | null;
}

const Seating = () => {
  const [departments, setDepartments] = useState<DepartmentConfig[]>([
    { id: '1', department: '', startRegNo: '', endRegNo: '', prefix: 'A' },
    { id: '2', department: '', startRegNo: '', endRegNo: '', prefix: 'B' }
  ]);
  const [centerName, setCenterName] = useState("");
  const [centerCode, setCenterCode] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [rows, setRows] = useState(5);
  const [cols, setColumns] = useState(6);
  const [seats, setSeats] = useState<Seat[]>([]);
  const { toast } = useToast();

  // Mock data for center details
  const examCenters = [
    { name: "Engineering Block", code: "ENG-01" },
    { name: "Science Block", code: "SCI-01" },
    { name: "Arts Block", code: "ART-01" },
  ];

  const rooms = [
    { number: "101", floor: "1" },
    { number: "102", floor: "1" },
    { number: "201", floor: "2" },
    { number: "202", floor: "2" },
  ];

  // Mock department data
  const departmentsList = [
    { id: "1", name: "Computer Science" },
    { id: "2", name: "Electronics" },
    { id: "3", name: "Mechanical" },
    { id: "4", name: "Civil" },
    { id: "5", name: "Electrical" },
  ];

  const addDepartment = () => {
    if (departments.length >= 5) {
      toast({
        title: "Error",
        description: "Maximum 5 departments allowed per hall",
        variant: "destructive",
      });
      return;
    }

    const newPrefix = String.fromCharCode(65 + departments.length); // A, B, C, D, E
    setDepartments([...departments, {
      id: (departments.length + 1).toString(),
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: newPrefix
    }]);
  };

  const removeDepartment = (id: string) => {
    if (departments.length <= 2) {
      toast({
        title: "Error",
        description: "Minimum 2 departments required",
        variant: "destructive",
      });
      return;
    }
    setDepartments(departments.filter(dept => dept.id !== id));
  };

  const updateDepartment = (id: string, field: keyof DepartmentConfig, value: string) => {
    setDepartments(departments.map(dept => 
      dept.id === id ? { ...dept, [field]: value } : dept
    ));
  };

  const generateStudentList = (deptConfig: DepartmentConfig) => {
    const students = [];
    const start = parseInt(deptConfig.startRegNo);
    const end = parseInt(deptConfig.endRegNo);
    let seatNumber = 1;
    
    for (let i = start; i <= end; i++) {
      students.push({
        name: `${deptConfig.department} Student`,
        regNo: i.toString().padStart(3, '0'),
        department: deptConfig.department,
        seatNo: `${deptConfig.prefix}${seatNumber++}`
      });
    }
    return students;
  };

  const generateSeating = () => {
    // Validate required fields
    if (!centerName || !centerCode || !roomNo || !floorNo) {
      toast({
        title: "Error",
        description: "Please fill in all center details",
        variant: "destructive",
      });
      return;
    }

    // Validate department configurations
    const invalidDept = departments.find(dept => 
      !dept.department || !dept.startRegNo || !dept.endRegNo
    );
    if (invalidDept) {
      toast({
        title: "Error",
        description: "Please fill in all department details",
        variant: "destructive",
      });
      return;
    }

    // Generate student lists for all departments
    const allStudentsLists = departments.map(dept => generateStudentList(dept));
    
    // Create an array of all seats
    const totalSeats = rows * cols;
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      seatNo: '',
      studentName: null,
      regNo: null,
      department: null,
    }));

    // Interleave students from all departments
    const allStudents: any[] = [];
    let maxLength = Math.max(...allStudentsLists.map(list => list.length));
    
    for (let i = 0; i < maxLength; i++) {
      for (let deptList of allStudentsLists) {
        if (deptList[i]) {
          allStudents.push(deptList[i]);
        }
      }
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
      departments,
      centerName,
      centerCode,
      roomNo,
      floorNo,
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
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Examination Center Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select value={centerName} onValueChange={(value) => {
                setCenterName(value);
                const center = examCenters.find(c => c.name === value);
                if (center) {
                  setCenterCode(center.code);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Center" />
                </SelectTrigger>
                <SelectContent>
                  {examCenters.map((center) => (
                    <SelectItem key={center.code} value={center.name}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Center Code"
                value={centerCode}
                readOnly
                className="bg-gray-50"
              />

              <Select value={roomNo} onValueChange={(value) => {
                setRoomNo(value);
                const room = rooms.find(r => r.number === value);
                if (room) {
                  setFloorNo(room.floor);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.number} value={room.number}>
                      Room {room.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Floor Number"
                value={floorNo}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Department Configurations */}
        <div className="space-y-4">
          {departments.map((dept, index) => (
            <div key={dept.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Department {index + 1} ({dept.prefix} Series)</h3>
                {departments.length > 2 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeDepartment(dept.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select 
                  value={dept.department} 
                  onValueChange={(value) => updateDepartment(dept.id, 'department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsList.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Start Reg No"
                  value={dept.startRegNo}
                  onChange={(e) => updateDepartment(dept.id, 'startRegNo', e.target.value)}
                />
                <Input
                  placeholder="End Reg No"
                  value={dept.endRegNo}
                  onChange={(e) => updateDepartment(dept.id, 'endRegNo', e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            onClick={addDepartment}
            disabled={departments.length >= 5}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
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
                    ? departments.find(d => d.department === seat.department)?.department === seat.department
                      ? `bg-${departments.findIndex(d => d.department === seat.department) % 5 === 0 ? 'blue' : 
                          departments.findIndex(d => d.department === seat.department) % 5 === 1 ? 'green' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 2 ? 'yellow' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 3 ? 'purple' :
                          'pink'}-100 border-${departments.findIndex(d => d.department === seat.department) % 5 === 0 ? 'blue' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 1 ? 'green' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 2 ? 'yellow' :
                          departments.findIndex(d => d.department === seat.department) % 5 === 3 ? 'purple' :
                          'pink'}-200`
                      : "bg-gray-100 border-gray-200"
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

