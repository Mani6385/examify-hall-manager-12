
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Edit, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { SeatingArrangement, formatDepartmentsWithYears } from "@/utils/reportUtils";
import { DetailedReportView } from "./DetailedReportView";
import { SeatingGridPreview } from "./SeatingGridPreview";
import { useNavigate } from "react-router-dom";
import { getHallNameById } from "@/utils/hallUtils";

interface ArrangementsTableProps {
  arrangements: SeatingArrangement[];
  isLoading: boolean;
  selectedHall: string;
  onRemoveArrangement?: (id: string) => void;
}

export function ArrangementsTable({ 
  arrangements, 
  isLoading, 
  selectedHall,
  onRemoveArrangement
}: ArrangementsTableProps) {
  const navigate = useNavigate();
  
  // Navigate to Seating page
  const goToSeatingPage = () => {
    navigate('/seating');
  };

  // Navigate to edit a specific seating plan
  const editSeatingPlan = (arrangementId: string) => {
    navigate(`/seating?edit=${arrangementId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (arrangements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50 my-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No seating arrangements found {selectedHall !== "all" ? `for ${getHallNameById(selectedHall)}` : ""}</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {selectedHall !== "all" 
            ? `There are no seating plans created for ${getHallNameById(selectedHall)} yet. Please select a different hall or create a new seating plan.`
            : "There are no seating plans in the system. Create a seating plan first to view and generate reports."}
        </p>
        <Button onClick={goToSeatingPage} className="bg-indigo-600 hover:bg-indigo-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Seating Plan
        </Button>
      </div>
    );
  }

  // Group arrangements by department and year using the new utility function
  const groupedArrangements = arrangements.reduce((acc, arrangement) => {
    return {
      ...acc,
      [arrangement.id]: formatDepartmentsWithYears(arrangement)
    };
  }, {} as Record<string, string>);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hall</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Floor</TableHead>
          <TableHead>Dimensions</TableHead>
          <TableHead>Departments & Years</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {arrangements.map((arrangement) => {
          // Get the hall name either from arrangement.hall_name or derive it from room number
          const hallName = arrangement.hall_name || (() => {
            const roomFirstDigit = arrangement.room_no.charAt(0);
            const mappedHallId = roomFirstDigit === '1' ? '1' : 
                                roomFirstDigit === '2' ? '2' : '3';
            return getHallNameById(mappedHallId);
          })();
          
          return (
            <TableRow key={arrangement.id}>
              <TableCell className="font-medium">{hallName || "Not specified"}</TableCell>
              <TableCell>{arrangement.room_no}</TableCell>
              <TableCell>{arrangement.floor_no}</TableCell>
              <TableCell>{arrangement.rows} × {arrangement.columns}</TableCell>
              <TableCell className="max-w-xs truncate" title={groupedArrangements[arrangement.id]}>
                {groupedArrangements[arrangement.id]}
              </TableCell>
              <TableCell>{arrangement.seating_assignments.length}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <SeatingGridPreview arrangement={arrangement} />
                  <DetailedReportView arrangement={arrangement} />
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                    onClick={() => editSeatingPlan(arrangement.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {onRemoveArrangement && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveArrangement(arrangement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
