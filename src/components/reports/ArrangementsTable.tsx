
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { SeatingArrangement } from "@/utils/reportUtils";
import { DetailedReportView } from "./DetailedReportView";
import { SeatingGridPreview } from "./SeatingGridPreview";
import { useNavigate } from "react-router-dom";

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
          <span className="font-medium">No seating arrangements found {selectedHall !== "all" ? "for this hall" : ""}</span>
        </div>
        <p className="text-muted-foreground text-center max-w-md">
          {selectedHall !== "all" 
            ? "There are no seating plans created for this hall yet. Please select a different hall or create a new seating plan."
            : "There are no seating plans in the system. Create a seating plan first to view and generate reports."}
        </p>
        <Button onClick={goToSeatingPage} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Seating Plan
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Room</TableHead>
          <TableHead>Floor</TableHead>
          <TableHead>Dimensions</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {arrangements.map((arrangement) => (
          <TableRow key={arrangement.id}>
            <TableCell className="font-medium">{arrangement.room_no}</TableCell>
            <TableCell>{arrangement.floor_no}</TableCell>
            <TableCell>{arrangement.rows} × {arrangement.columns}</TableCell>
            <TableCell>{arrangement.seating_assignments.length}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <SeatingGridPreview arrangement={arrangement} />
                <DetailedReportView arrangement={arrangement} />
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
        ))}
      </TableBody>
    </Table>
  );
}
