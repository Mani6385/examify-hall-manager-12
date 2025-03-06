
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
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Seat {
  id: number;
  seatNo: string;
  studentName: string | null;
  regNo: string | null;
  department: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
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

  const generateSeating = () => {
    if (!centerName || !centerCode || !roomNo || !floorNo) {
      toast({
        title: "Error",
        description: "Please fill in all center details",
        variant: "destructive",
      });
      return;
    }

    // Initialize seats array
    const totalSeats = rows * cols;
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      seatNo: `${String.fromCharCode(65 + Math.floor(index / cols))}${(index % cols) + 1}`,
      studentName: null,
      regNo: null,
      department: null,
    }));
    
    setSeats(emptySeats);
    
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
                    ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
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
                  <>
                    <span className="font-bold text-lg mb-1">{seat.seatNo}</span>
                    <span className="text-xs text-gray-500">Empty</span>
                  </>
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

