
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

  const groupedSubjects = departmentsList.reduce((acc, subject) => {
    if (!acc[subject.department]) {
      acc[subject.department] = [];
    }
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, typeof departmentsList>);

  const createSeatingMutation = useMutation({
    mutationFn: async () => {
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

  const addASeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'A'  // Always 'A' for the A series
    }]);

    toast({
      title: "Success",
      description: "Added new department to A series",
    });
  };

  const addBSeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'B'  // Always 'B' for the B series
    }]);

    toast({
      title: "Success",
      description: "Added new department to B series",
    });
  };

  const removeDepartment = (id: string) => {
    const aSeriesDepts = departments.filter(dept => dept.prefix === 'A');
    const bSeriesDepts = departments.filter(dept => dept.prefix === 'B');
    
    const targetDept = departments.find(d => d.id === id);
    if (!targetDept) return;

    if (targetDept.prefix === 'A' && aSeriesDepts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the only A series department",
        variant: "destructive",
      });
      return;
    }

    if (targetDept.prefix === 'B' && bSeriesDepts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the only B series department",
        variant: "destructive",
      });
      return;
    }

    setDepartments(departments.filter(d => d.id !== id));
    
    toast({
      title: "Success",
      description: `Removed department from ${targetDept.prefix} series`,
    });
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
    if (!centerName || !centerCode || !roomNo || !floorNo) {
      toast({
        title: "Error",
        description: "Please fill in all center details",
        variant: "destructive",
      });
      return;
    }

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

    const allStudentsLists = departments.map(dept => generateStudentList(dept));
    
    const totalSeats = rows * cols;
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      seatNo: '',
      studentName: null,
      regNo: null,
      department: null,
    }));

    const allStudents: any[] = [];
    let maxLength = Math.max(...allStudentsLists.map(list => list.length));
    
    for (let i = 0; i < maxLength; i++) {
      for (let deptList of allStudentsLists) {
        if (deptList[i]) {
          allStudents.push(deptList[i]);
        }
      }
    }

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
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="w-full max-w-md relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="relative backdrop-blur-sm bg-white/80 p-8 rounded-2xl shadow-2xl border border-white/20 space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="inline-block p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 mb-4">
                  <LogIn className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground">
                  Sign in to access the seating arrangement system
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-10 bg-white/50 border-blue-200 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-white/50 border-blue-200 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/80 text-gray-500">Demo Credentials</span>
                  </div>
                </div>

                <div className="text-sm text-center space-y-1 text-gray-600">
                  <p>Username: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">admin</span></p>
                  <p>Password: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">admin123</span></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Exam Hall Seating Arrangement
          </h2>
          <p className="text-muted-foreground mt-2">
            Generate and manage exam hall seating arrangements for multiple departments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 shadow-sm">
            <h3 className="font-semibold text-blue-800">Examination Center Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select value={centerName} onValueChange={(value) => {
                setCenterName(value);
                const center = examCenters.find(c => c.name === value);
                if (center) {
                  setCenterCode(center.code);
                }
              }}>
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
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
                className="bg-white/50 border-blue-200"
              />

              <Input
                placeholder="Room Number"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                className="border-blue-200 focus:border-blue-400"
              />

              <Input
                placeholder="Floor Number"
                value={floorNo}
                onChange={(e) => setFloorNo(e.target.value)}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-800">Department Configuration</h3>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={addASeries}
                className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add A Series Department
              </Button>
              <Button 
                variant="outline" 
                onClick={addBSeries}
                className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add B Series Department
              </Button>
            </div>
          </div>

          {departments.map((dept, index) => (
            <div key={dept.id} className={`p-6 rounded-lg border shadow-sm transition-all hover:shadow-md ${
              dept.prefix === 'A' 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
                : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-blue-800">
                  Department {index + 1} 
                  <span className={`ml-2 px-2 py-1 rounded-md text-sm ${
                    dept.prefix === 'A' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {dept.prefix} Series
                  </span>
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeDepartment(dept.id)}
                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select 
                  value={dept.department} 
                  onValueChange={(value) => updateDepartment(dept.id, 'department', value)}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
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
                  className="border-blue-200 focus:border-blue-400"
                />
                <Input
                  placeholder="End Reg No"
                  value={dept.endRegNo}
                  onChange={(e) => updateDepartment(dept.id, 'endRegNo', e.target.value)}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Button onClick={generateSeating} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
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
          <div className="grid gap-4" style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
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
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 opacity-50"
                } flex flex-col items-center justify-center text-center min-h-[120px] text-sm border animate-fadeIn`}
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
