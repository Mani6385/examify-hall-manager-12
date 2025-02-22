
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { useState } from "react";
import { File, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  subject: string | null;
  seating_arrangements: {
    id: string;
    room_no: string;
    floor_no: string;
  };
}

interface Hall {
  id: string;
  room_no: string;
  floor_no: string;
}

const Reports = () => {
  const { toast } = useToast();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>("");

  const { data: halls = [], isLoading: isLoadingHalls } = useQuery({
    queryKey: ['halls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select('id, room_no, floor_no')
        .order('room_no, floor_no');

      if (error) throw error;
      return data as Hall[];
    },
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['seating-assignments', selectedHall],
    enabled: !!selectedHall,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_assignments')
        .select(`
          id,
          seat_no,
          reg_no,
          department,
          seating_arrangements!seating_assignments_arrangement_id_fkey (
            id,
            room_no,
            floor_no
          )
        `)
        .eq('arrangement_id', selectedHall);

      if (error) throw error;
      return data as SeatingAssignment[];
    },
  });

  const generateHallSeatingPlanExcel = async () => {
    try {
      setIsLoadingExcel(true);
      if (!assignments || assignments.length === 0) {
        throw new Error("No assignments data available");
      }

      const wb = XLSX.utils.book_new();
      const hall = assignments[0].seating_arrangements;

      // Create summary worksheet
      const summaryData = [{
        "Room Number": hall.room_no,
        "Floor Number": hall.floor_no,
        "Total Seats": assignments.length,
        "Occupied Seats": assignments.filter((a) => a.reg_no).length
      }];

      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Create detailed seating plan worksheet
      const seatingData = assignments.map((assignment) => ({
        "Seat Number": assignment.seat_no,
        "Registration Number": assignment.reg_no || "N/A",
        "Department": assignment.department || "N/A",
      }));

      const seatingWS = XLSX.utils.json_to_sheet(seatingData);
      XLSX.utils.book_append_sheet(wb, seatingWS, "Seating Plan");

      // Auto-size columns for both worksheets
      [summaryWS, seatingWS].forEach((ws) => {
        const cols = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.c + 1 : 0;
        ws['!cols'] = [];
        for (let i = 0; i < cols; i++) {
          let maxWidth = 10;
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          for (let row = range.s.r; row <= range.e.r; row++) {
            const cell = ws[XLSX.utils.encode_cell({ r: row, c: i })];
            if (cell && cell.v) {
              maxWidth = Math.max(maxWidth, String(cell.v).length + 2);
            }
          }
          ws['!cols'][i] = { wch: maxWidth };
        }
      });

      const fileName = `seating-plan-${hall.room_no}-${hall.floor_no}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Success",
        description: "Hall seating plan Excel file generated successfully",
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate hall seating plan Excel file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const isLoading = isLoadingHalls || isLoadingAssignments;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hall-wise Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate and download exam hall seating arrangements by room
          </p>
        </div>

        <div className="grid gap-6">
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Hall</h3>
              <Select
                value={selectedHall}
                onValueChange={setSelectedHall}
                disabled={isLoadingHalls}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a hall..." />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      Room {hall.room_no} - Floor {hall.floor_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedHall && (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Generate Seating Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    Download hall-specific seating plan in Excel format
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={generateHallSeatingPlanExcel}
                  disabled={isLoading || isLoadingExcel || !assignments?.length}
                >
                  {isLoadingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <File className="mr-2 h-4 w-4" />
                      Excel
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
