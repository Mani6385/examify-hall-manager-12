
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { SeatingArrangement } from "@/utils/reportUtils";

interface ArrangementsTableProps {
  arrangements: SeatingArrangement[];
  isLoading: boolean;
  selectedHall: string;
}

export function ArrangementsTable({ arrangements, isLoading, selectedHall }: ArrangementsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (arrangements.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No seating arrangements found {selectedHall && "for this hall"}
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {arrangements.map((arrangement) => (
          <TableRow key={arrangement.id}>
            <TableCell className="font-medium">{arrangement.room_no}</TableCell>
            <TableCell>{arrangement.floor_no}</TableCell>
            <TableCell>{arrangement.rows} × {arrangement.columns}</TableCell>
            <TableCell>{arrangement.seating_assignments.length}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
