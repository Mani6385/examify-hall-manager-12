
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Edit, Eye, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { SeatingArrangement, formatDepartmentsWithYears, mapRoomToHallId } from "@/utils/reportUtils";
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
  
  const goToSeatingPage = () => {
    navigate('/seating');
  };

  const editSeatingPlan = (arrangementId: string) => {
    navigate(`/seating?edit=${arrangementId}`);
  };

  const viewSeatingPlan = (arrangementId: string) => {
    navigate(`/seating-view?id=${arrangementId}`);
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
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="flex items-center text-amber-500">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span className="font-medium">No seating arrangements found {selectedHall !== "all" ? `for ${getHallNameById(selectedHall)}` : ""}</span>
        </div>
        <p className="text-muted-foreground text-center max-w-md">
          {selectedHall !== "all" 
            ? `There are no seating plans created for ${getHallNameById(selectedHall)} yet. Please select a different hall or create a new seating plan.`
            : "There are no seating plans in the system. Create a seating plan first to view and generate reports."}
        </p>
        <Button onClick={goToSeatingPage} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Seating Plan
        </Button>
      </div>
    );
  }

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
          const hallName = arrangement.hall_name || (() => {
            const mappedHallId = mapRoomToHallId(arrangement.room_no);
            if (!arrangement.hall_id) {
              arrangement.hall_id = mappedHallId;
            }
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
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                    onClick={() => viewSeatingPlan(arrangement.id)}
                    title="View Seating Plan"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                    onClick={() => editSeatingPlan(arrangement.id)}
                    title="Edit Seating Plan"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {onRemoveArrangement && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveArrangement(arrangement.id)}
                      title="Delete Seating Plan"
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
