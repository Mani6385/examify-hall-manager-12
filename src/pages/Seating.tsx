
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

const Seating = () => {
  const { toast } = useToast();

  const [departments, setDepartments] = useState<DepartmentConfig[]>([
    { id: '1', department: '', startRegNo: '', endRegNo: '', prefix: 'A' },
    { id: '2', department: '', startRegNo: '', endRegNo: '', prefix: 'B' }
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

  const { data: halls = [] } = useQuery({
    queryKey: ['halls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halls')
        .select('*')
        .order('name');
      
      if (error) throw error;
      // If there's no data, return a default set of halls
      return data || [
        { id: '1', name: 'Hall A', capacity: 30 },
        { id: '2', name: 'Hall B', capacity: 40 },
        { id: '3', name: 'Hall C', capacity: 50 }
      ];
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
          hall_id: selectedHall || null,
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
        description: `${selectedHallData.name} selected with ${capacity} seats (${optimalRows} rows × ${optimalColumns} columns)`,
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

    // Improved seating arrangement algorithm
    const totalSeats = rows * cols;
    const aSeriesDepts = departments.filter(dept => dept.prefix === 'A');
    const bSeriesDepts = departments.filter(dept => dept.prefix === 'B');
    
    // Generate all students from all departments
    const aSeriesStudents: Student[] = [];
    aSeriesDepts.forEach(dept => {
      aSeriesStudents.push(...generateStudentList(dept));
    });
    
    const bSeriesStudents: Student[] = [];
    bSeriesDepts.forEach(dept => {
      bSeriesStudents.push(...generateStudentList(dept));
    });
    
    // Initialize seats with empty values
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      seatNo: '',
      studentName: null,
      regNo: null,
      department: null,
    }));
    
    // Distribute students in a zigzag pattern (alternating A and B series)
    const assignedStudents: (Student | null)[] = Array(totalSeats).fill(null);
    
    // Calculate how many students we can place from each series
    const maxPerSeries = Math.ceil(totalSeats / 2);
    const aCount = Math.min(aSeriesStudents.length, maxPerSeries);
    const bCount = Math.min(bSeriesStudents.length, maxPerSeries);
    
    // Place A series students in even positions
    for (let i = 0; i < aCount; i++) {
      const position = i * 2; // Even positions (0, 2, 4, ...)
      if (position < totalSeats) {
        assignedStudents[position] = aSeriesStudents[i];
      }
    }
    
    // Place B series students in odd positions
    for (let i = 0; i < bCount; i++) {
      const position = i * 2 + 1; // Odd positions (1, 3, 5, ...)
      if (position < totalSeats) {
        assignedStudents[position] = bSeriesStudents[i];
      }
    }
    
    // Fill remaining seats with any leftover students
    let remainingIndex = 0;
    for (let i = aCount * 2; i < totalSeats; i += 2) {
      if (assignedStudents[i] === null && remainingIndex + aCount < aSeriesStudents.length) {
        assignedStudents[i] = aSeriesStudents[aCount + remainingIndex];
        remainingIndex++;
      }
    }
    
    remainingIndex = 0;
    for (let i = bCount * 2 + 1; i < totalSeats; i += 2) {
      if (assignedStudents[i] === null && remainingIndex + bCount < bSeriesStudents.length) {
        assignedStudents[i] = bSeriesStudents[bCount + remainingIndex];
        remainingIndex++;
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
