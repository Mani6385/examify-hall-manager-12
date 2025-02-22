import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { useState } from "react";
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw, Plus, Trash2, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

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
  subjectCode?: string | null;
  subjectName?: string | null;
}

const Seating = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

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
  const queryClient = useQueryClient();

  // Fetch exam centers from Supabase
  const { data: examCenters = [] } = useQuery({
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

  // Fetch departments and their subjects from Supabase
  const { data: departmentsList = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('department, name');
      
      if (error) throw error;
      return data;
    },
  });

  // Group subjects by department
  const groupedSubjects = departmentsList.reduce((acc, subject) => {
    if (!acc[subject.department]) {
      acc[subject.department] = [];
    }
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, typeof departmentsList>);

  // Create seating arrangement mutation
  const createSeatingMutation = useMutation({
    mutationFn: async () => {
      // First create the seating arrangement
      const { data: arrangement, error: arrangementError } = await supabase
        .from('seating_arrangements')
        .insert([{
          room_no: roomNo,
          floor_no: floorNo,
          rows: rows,
          columns: cols,
        }])
        .select()
        .single();

      if (arrangementError) throw arrangementError;

      // Then create department configs
      const departmentConfigPromises = departments.map(dept => 
        supabase
          .from('department_configs')
          .insert([{
            arrangement_id: arrangement.id,
            department: dept.department,
            start_reg_no: dept.startRegNo,
            end_reg_no: dept.endRegNo,
            prefix: dept.prefix,
          }])
      );

      await Promise.all(departmentConfigPromises);

      // Finally create seating assignments
      const seatingAssignments = seats.map((seat, index) => ({
        arrangement_id: arrangement.id,
        seat_no: seat.seatNo,
        student_name: seat.studentName,
        reg_no: seat.regNo,
        department: seat.department,
        position: index,
      }));

      const { error: assignmentsError } = await supabase
        .from('seating_assignments')
        .insert(seatingAssignments);

      if (assignmentsError) throw assignmentsError;

      return arrangement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seatingArrangements'] });
      toast({
        title: "Success",
        description: "Seating arrangement saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save seating arrangement",
        variant: "destructive",
      });
      console.error("Error saving seating arrangement:", error);
    },
  });

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
    
    // Find the department and subject details
    const subject = departmentsList.find(d => d.name === deptConfig.department);
    const departmentName = subject?.department || 'Unknown Department';
    const subjectName = subject?.name || deptConfig.department;
    const subjectCode = subject?.code;
    
    for (let i = start; i <= end; i++) {
      students.push({
        name: `${departmentName} Student`,
        regNo: i.toString().padStart(3, '0'),
        department: departmentName,
        subjectCode: subjectCode,
        subjectName: subjectName,
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
      subjectCode: allStudents[index]?.subjectCode || null,
      subjectName: allStudents[index]?.subjectName || null,
    }));

    setSeats(assignedSeats);

    // Save to Supabase
    createSeatingMutation.mutate();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here we're using a simple check - in a real app, you'd want to use proper authentication
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Login Required</h2>
              <p className="text-muted-foreground mt-2">
                Please log in to access the seating arrangement system
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Default credentials: username: admin, password: admin123
              </p>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

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
                    <SelectItem key={center.id} value={center.name}>
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

              <Input
                placeholder="Room Number"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
              />

              <Input
                placeholder="Floor Number"
                value={floorNo}
                onChange={(e) => setFloorNo(e.target.value)}
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
                    <SelectValue placeholder="Select department and module" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedSubjects).map(([department, subjects]) => (
                      <SelectGroup key={department}>
                        <SelectLabel className="font-bold">{department}</SelectLabel>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectGroup>
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
                    <span className="text-xs text-gray-500">
                      {seat.subjectCode} - {seat.subjectName}
                    </span>
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
