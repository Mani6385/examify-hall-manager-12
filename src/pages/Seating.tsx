
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
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

interface Student {
  name: string;
  regNo: string;
  department: string;
  subjectCode?: string;
  subjectName?: string;
  seatNo: string;
}

interface Hall {
  id: string;
  name: string;
  capacity: number;
}

// Define some default halls since we don't have a halls table in the database
const DEFAULT_HALLS: Hall[] = [
  { id: '1', name: 'Hall A', capacity: 30 },
  { id: '2', name: 'Hall B', capacity: 40 },
  { id: '3', name: 'Hall C', capacity: 50 }
];

const Seating = () => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState<DepartmentConfig[]>([
    { id: '1', department: '', startRegNo: '', endRegNo: '', prefix: 'A' },
    { id: '2', department: '', startRegNo: '', endRegNo: '', prefix: 'B' },
    { id: '3', department: '', startRegNo: '', endRegNo: '', prefix: 'C' },
    { id: '4', department: '', startRegNo: '', endRegNo: '', prefix: 'D' }
  ]);
  const [centerName, setCenterName] = useState("");
  const [centerCode, setCenterCode] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [selectedHall, setSelectedHall] = useState("");
  const [rows, setRows] = useState(5);
  const [cols, setColumns] = useState(6);
  const [seats, setSeats] = useState<Seat[]>([]);
  const queryClient = useQueryClient();
  
  // Instead of fetching halls from the database (which doesn't exist), we'll use our default halls
  const halls = DEFAULT_HALLS;

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

  const handleHallSelect = (hallId: string) => {
    setSelectedHall(hallId);
    const selectedHallData = halls.find(h => h.id === hallId);
    if (selectedHallData) {
      // Calculate appropriate rows and columns based on hall capacity
      const capacity = selectedHallData.capacity;
      const optimalColumns = Math.ceil(Math.sqrt(capacity));
      const optimalRows = Math.ceil(capacity / optimalColumns);
      
      setRows(optimalRows);
      setColumns(optimalColumns);
      
      toast({
        title: "Hall Selected",
        description: `${selectedHallData.name} selected with ${capacity} seats (${optimalRows} rows × ${optimalColumns})`,
      });
    }
  };

  const addASeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'A'
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
      prefix: 'B'
    }]);

    toast({
      title: "Success",
      description: "Added new department to B series",
    });
  };

  const addCSeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'C'
    }]);

    toast({
      title: "Success",
      description: "Added new department to C series",
    });
  };

  const addDSeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'D'
    }]);

    toast({
      title: "Success",
      description: "Added new department to D series",
    });
  };

  const addESeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'E'
    }]);

    toast({
      title: "Success",
      description: "Added new department to E series",
    });
  };

  const addFSeries = () => {
    const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
    setDepartments([...departments, {
      id: newId,
      department: '',
      startRegNo: '',
      endRegNo: '',
      prefix: 'F'
    }]);

    toast({
      title: "Success",
      description: "Added new department to F series",
    });
  };

  const removeDepartment = (id: string) => {
    const aSeriesDepts = departments.filter(dept => dept.prefix === 'A');
    const bSeriesDepts = departments.filter(dept => dept.prefix === 'B');
    const cSeriesDepts = departments.filter(dept => dept.prefix === 'C');
    const dSeriesDepts = departments.filter(dept => dept.prefix === 'D');
    const eSeriesDepts = departments.filter(dept => dept.prefix === 'E');
    const fSeriesDepts = departments.filter(dept => dept.prefix === 'F');
    
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

    if (targetDept.prefix === 'C' && cSeriesDepts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the only C series department",
        variant: "destructive",
      });
      return;
    }

    if (targetDept.prefix === 'D' && dSeriesDepts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the only D series department",
        variant: "destructive",
      });
      return;
    }

    if (targetDept.prefix === 'E' && eSeriesDepts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the only E series department",
        variant: "destructive",
      });
      return;
    }

    if (targetDept.prefix === 'F' && fSeriesDepts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the only F series department",
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

  const generateStudentList = (deptConfig: DepartmentConfig): Student[] => {
    const students: Student[] = [];
    
    if (!deptConfig.startRegNo || !deptConfig.endRegNo || !deptConfig.department) {
      return students;
    }
    
    const start = parseInt(deptConfig.startRegNo);
    const end = parseInt(deptConfig.endRegNo);
    
    if (isNaN(start) || isNaN(end) || end < start) {
      return students;
    }
    
    const subject = departmentsList.find(d => d.name === deptConfig.department);
    const departmentName = subject?.department || 'Unknown Department';
    const subjectName = subject?.name || deptConfig.department;
    const subjectCode = subject?.code;
    
    // Start from seat 1 for each department series
    for (let i = start, seatNum = 1; i <= end; i++, seatNum++) {
      students.push({
        name: `${departmentName} Student`,
        regNo: i.toString().padStart(3, '0'),
        department: departmentName,
        subjectCode: subjectCode,
        subjectName: subjectName,
        // Format: A1, A2, etc. or B1, B2, etc. (no space between letter and number)
        seatNo: `${deptConfig.prefix}${seatNum}`
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

    // Updated seating arrangement algorithm for A1, B1, C1, D1, E1, F1, A2, B2, ... format
    const totalSeats = rows * cols;
    
    // Group departments by series (A, B, C, D, E, F)
    const aSeriesDepts = departments.filter(dept => dept.prefix === 'A');
    const bSeriesDepts = departments.filter(dept => dept.prefix === 'B');
    const cSeriesDepts = departments.filter(dept => dept.prefix === 'C');
    const dSeriesDepts = departments.filter(dept => dept.prefix === 'D');
    const eSeriesDepts = departments.filter(dept => dept.prefix === 'E');
    const fSeriesDepts = departments.filter(dept => dept.prefix === 'F');
    
    // Generate all students from all departments
    const aSeriesStudents: Student[] = [];
    aSeriesDepts.forEach(dept => {
      aSeriesStudents.push(...generateStudentList(dept));
    });
    
    const bSeriesStudents: Student[] = [];
    bSeriesDepts.forEach(dept => {
      bSeriesStudents.push(...generateStudentList(dept));
    });

    const cSeriesStudents: Student[] = [];
    cSeriesDepts.forEach(dept => {
      cSeriesStudents.push(...generateStudentList(dept));
    });
    
    const dSeriesStudents: Student[] = [];
    dSeriesDepts.forEach(dept => {
      dSeriesStudents.push(...generateStudentList(dept));
    });

    const eSeriesStudents: Student[] = [];
    eSeriesDepts.forEach(dept => {
      eSeriesStudents.push(...generateStudentList(dept));
    });
    
    const fSeriesStudents: Student[] = [];
    fSeriesDepts.forEach(dept => {
      fSeriesStudents.push(...generateStudentList(dept));
    });
    
    // Initialize seats with empty values
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      seatNo: '',
      studentName: null,
      regNo: null,
      department: null,
    }));
    
    // Find maximum number of students across all series to determine iteration count
    const maxStudentsPerSeries = Math.max(
      aSeriesStudents.length, 
      bSeriesStudents.length,
      cSeriesStudents.length,
      dSeriesStudents.length,
      eSeriesStudents.length,
      fSeriesStudents.length
    );
    
    const assignedStudents: (Student | null)[] = Array(totalSeats).fill(null);
    
    // Assign students in A1, B1, C1, D1, E1, F1, A2, B2, ... pattern
    let seatIndex = 0;
    for (let i = 0; i < maxStudentsPerSeries; i++) {
      // Add A series student
      if (i < aSeriesStudents.length && seatIndex < totalSeats) {
        assignedStudents[seatIndex++] = aSeriesStudents[i];
      }
      
      // Add B series student
      if (i < bSeriesStudents.length && seatIndex < totalSeats) {
        assignedStudents[seatIndex++] = bSeriesStudents[i];
      }

      // Add C series student
      if (i < cSeriesStudents.length && seatIndex < totalSeats) {
        assignedStudents[seatIndex++] = cSeriesStudents[i];
      }
      
      // Add D series student
      if (i < dSeriesStudents.length && seatIndex < totalSeats) {
        assignedStudents[seatIndex++] = dSeriesStudents[i];
      }

      // Add E series student
      if (i < eSeriesStudents.length && seatIndex < totalSeats) {
        assignedStudents[seatIndex++] = eSeriesStudents[i];
      }
      
      // Add F series student
      if (i < fSeriesStudents.length && seatIndex < totalSeats) {
        assignedStudents[seatIndex++] = fSeriesStudents[i];
      }
    }
    
    // Convert to the final seats format
    const finalSeats = emptySeats.map((seat, index) => {
      const student = assignedStudents[index];
      if (student) {
        return {
          ...seat,
          seatNo: student.seatNo,
          studentName: student.name,
          regNo: student.regNo,
          department: student.department,
          subjectCode: student.subjectCode,
          subjectName: student.subjectName,
        };
      }
      return seat;
    });
    
    setSeats(finalSeats);
    
    toast({
      title: "Success",
      description: "Seating arrangement generated successfully",
    });
    
    createSeatingMutation.mutate();
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

              <Select 
                value={selectedHall} 
                onValueChange={handleHallSelect}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select Hall" />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name} (Capacity: {hall.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
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

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Rows</p>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={rows}
                    onChange={(e) => setRows(parseInt(e.target.value) || 5)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Columns</p>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={cols}
                    onChange={(e) => setColumns(parseInt(e.target.value) || 6)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-800">Department Configuration</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={addASeries}
                className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add A Series
              </Button>
              <Button 
                variant="outline" 
                onClick={addBSeries}
                className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add B Series
              </Button>
              <Button 
                variant="outline" 
                onClick={addCSeries}
                className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:border-green-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add C Series
              </Button>
              <Button 
                variant="outline" 
                onClick={addDSeries}
                className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add D Series
              </Button>
              <Button 
                variant="outline" 
                onClick={addESeries}
                className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:border-red-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add E Series
              </Button>
              <Button 
                variant="outline" 
                onClick={addFSeries}
                className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-400 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add F Series
              </Button>
            </div>
          </div>

          {departments.map((dept, index) => (
            <div key={dept.id} className={`p-6 rounded-lg border shadow-sm transition-all hover:shadow-md ${
              dept.prefix === 'A' 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
                : dept.prefix === 'B'
                  ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                  : dept.prefix === 'C'
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    : dept.prefix === 'D'
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                      : dept.prefix === 'E'
                        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                        : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-blue-800">
                  Department {index + 1} 
                  <span className={`ml-2 px-2 py-1 rounded-md text-sm ${
                    dept.prefix === 'A' 
                      ? 'bg-blue-100 text-blue-700' 
                      : dept.prefix === 'B'
                        ? 'bg-purple-100 text-purple-700'
                        : dept.prefix === 'C'
                          ? 'bg-green-100 text-green-700'
                          : dept.prefix === 'D'
                            ? 'bg-yellow-100 text-yellow-700'
                            : dept.prefix === 'E'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-indigo-100 text-indigo-700'
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Seating;
