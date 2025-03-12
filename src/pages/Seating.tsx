
import { Layout } from "@/components/dashboard/Layout";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CenterDetails } from "@/components/seating/CenterDetails";
import { DepartmentConfiguration } from "@/components/seating/DepartmentConfig";
import { SeatingGrid } from "@/components/seating/SeatingGrid";
import { DEFAULT_HALLS } from "@/utils/hallUtils";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DepartmentConfig, 
  addDepartmentSeries, 
  removeDepartment as removeDepartmentUtil, 
  updateDepartment as updateDepartmentUtil 
} from "@/utils/departmentUtils";
import { 
  Seat, 
  generateSeatingArrangement, 
  rotateStudents as rotateStudentsUtil 
} from "@/utils/studentUtils";

const Seating = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

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

  // Fetch existing seating arrangement data if in edit mode
  useEffect(() => {
    const fetchSeatingArrangement = async () => {
      if (!editId) return;
      setIsLoading(true);
      try {
        // Fetch arrangement details
        const { data: arrangementData, error: arrangementError } = await supabase
          .from('seating_arrangements')
          .select('*')
          .eq('id', editId)
          .single();
        
        if (arrangementError) throw arrangementError;
        
        if (arrangementData) {
          setRoomNo(arrangementData.room_no);
          setFloorNo(arrangementData.floor_no);
          setRows(arrangementData.rows);
          setColumns(arrangementData.columns);
          
          // Fetch department configs
          const { data: deptConfigData, error: deptConfigError } = await supabase
            .from('department_configs')
            .select('*')
            .eq('arrangement_id', editId);
          
          if (deptConfigError) throw deptConfigError;
          
          if (deptConfigData && deptConfigData.length > 0) {
            const formattedDepts = deptConfigData.map((dept, index) => ({
              id: (index + 1).toString(),
              department: dept.department,
              startRegNo: dept.start_reg_no,
              endRegNo: dept.end_reg_no,
              prefix: dept.prefix
            }));
            
            setDepartments(formattedDepts);
          }
          
          // Fetch seating assignments
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('seating_assignments')
            .select('*')
            .eq('arrangement_id', editId)
            .order('position');
          
          if (assignmentsError) throw assignmentsError;
          
          if (assignmentsData) {
            const formattedSeats: Seat[] = assignmentsData.map((assignment, index) => ({
              id: index,
              seatNo: assignment.seat_no,
              studentName: assignment.student_name,
              regNo: assignment.reg_no,
              department: assignment.department,
            }));
            
            setSeats(formattedSeats);
          }
          
          setIsEditing(true);
          toast({
            title: "Arrangement Loaded",
            description: `Editing seating arrangement for Room ${arrangementData.room_no}`,
          });
        }
      } catch (error) {
        console.error("Error fetching seating arrangement:", error);
        toast({
          title: "Error",
          description: "Failed to load seating arrangement",
          variant: "destructive",
        });
        navigate('/seating');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeatingArrangement();
  }, [editId, toast, navigate]);

  const groupedSubjects = departmentsList.reduce((acc, subject) => {
    if (!acc[subject.department]) {
      acc[subject.department] = [];
    }
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, typeof departmentsList>);

  const createSeatingMutation = useMutation({
    mutationFn: async () => {
      // If editing, update existing arrangement instead of creating new one
      if (isEditing && editId) {
        // Update the arrangement
        const { data: arrangement, error: arrangementError } = await supabase
          .from('seating_arrangements')
          .update({
            room_no: roomNo,
            floor_no: floorNo,
            rows: rows,
            columns: cols,
          })
          .eq('id', editId)
          .select()
          .single();

        if (arrangementError) throw arrangementError;

        // Delete existing department configs
        const { error: deleteConfigError } = await supabase
          .from('department_configs')
          .delete()
          .eq('arrangement_id', editId);

        if (deleteConfigError) throw deleteConfigError;

        // Add new department configs
        const departmentConfigPromises = departments.map(dept => 
          supabase
            .from('department_configs')
            .insert([{
              arrangement_id: editId,
              department: dept.department,
              start_reg_no: dept.startRegNo,
              end_reg_no: dept.endRegNo,
              prefix: dept.prefix,
            }])
        );

        await Promise.all(departmentConfigPromises);

        // Delete existing seating assignments
        const { error: deleteAssignmentsError } = await supabase
          .from('seating_assignments')
          .delete()
          .eq('arrangement_id', editId);

        if (deleteAssignmentsError) throw deleteAssignmentsError;

        // Add new seating assignments
        const seatingAssignments = seats.map((seat, index) => ({
          arrangement_id: editId,
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
      } else {
        // Create new arrangement
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seatingArrangements'] });
      toast({
        title: "Success",
        description: isEditing 
          ? "Seating arrangement updated successfully" 
          : "Seating arrangement saved successfully",
      });
      
      if (isEditing) {
        navigate('/reports');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update seating arrangement" 
          : "Failed to save seating arrangement",
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
    setDepartments(addDepartmentSeries(departments, 'A', { toast }));
  };

  const addBSeries = () => {
    setDepartments(addDepartmentSeries(departments, 'B', { toast }));
  };

  const addCSeries = () => {
    setDepartments(addDepartmentSeries(departments, 'C', { toast }));
  };

  const addDSeries = () => {
    setDepartments(addDepartmentSeries(departments, 'D', { toast }));
  };

  const addESeries = () => {
    setDepartments(addDepartmentSeries(departments, 'E', { toast }));
  };

  const addFSeries = () => {
    setDepartments(addDepartmentSeries(departments, 'F', { toast }));
  };

  const removeDepartment = (id: string) => {
    setDepartments(removeDepartmentUtil(departments, id, { toast }));
  };

  const updateDepartment = (id: string, field: keyof DepartmentConfig, value: string) => {
    setDepartments(updateDepartmentUtil(departments, id, field, value));
  };

  const generateSeating = () => {
    if (!centerName && !isEditing || !centerCode && !isEditing || !roomNo || !floorNo) {
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

    // Only generate new seats if not editing or if editing but seats are empty
    if (!isEditing || seats.length === 0) {
      const generatedSeats = generateSeatingArrangement(departments, rows, cols, departmentsList);
      setSeats(generatedSeats);
      
      toast({
        title: "Success",
        description: "Seating arrangement generated successfully",
      });
    }
    
    createSeatingMutation.mutate();
  };

  const rotateStudents = (direction: 'left' | 'right') => {
    if (seats.length === 0) return;

    const rotatedSeats = rotateStudentsUtil(seats, direction);
    setSeats(rotatedSeats);
    
    toast({
      title: "Success",
      description: `Students rotated ${direction}`,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading seating arrangement...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {isEditing ? "Edit Seating Arrangement" : "Exam Hall Seating Arrangement"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isEditing 
              ? "Modify the existing seating arrangement and save your changes" 
              : "Generate and manage exam hall seating arrangements for multiple departments"}
          </p>
          
          {isEditing && (
            <Alert className="mt-4">
              <AlertTitle>Editing Mode</AlertTitle>
              <AlertDescription>
                You are currently editing an existing seating arrangement. Make your changes and click "Generate Seating" to save.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CenterDetails
            centerName={centerName}
            setCenterName={setCenterName}
            centerCode={centerCode}
            setCenterCode={setCenterCode}
            selectedHall={selectedHall}
            handleHallSelect={handleHallSelect}
            roomNo={roomNo}
            setRoomNo={setRoomNo}
            floorNo={floorNo}
            setFloorNo={setFloorNo}
            rows={rows}
            setRows={setRows}
            cols={cols}
            setColumns={setColumns}
            examCenters={examCenters}
            halls={halls}
          />
        </div>

        <DepartmentConfiguration
          departments={departments}
          addASeries={addASeries}
          addBSeries={addBSeries}
          addCSeries={addCSeries}
          addDSeries={addDSeries}
          addESeries={addESeries}
          addFSeries={addFSeries}
          removeDepartment={removeDepartment}
          updateDepartment={updateDepartment}
          groupedSubjects={groupedSubjects}
        />

        <SeatingGrid
          seats={seats}
          setSeats={setSeats}
          generateSeating={generateSeating}
          rotateStudents={rotateStudents}
          departments={departments}
          rows={rows}
          cols={cols}
        />
      </div>
    </Layout>
  );
};

export default Seating;
