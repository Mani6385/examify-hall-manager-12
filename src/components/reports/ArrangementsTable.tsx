
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building, Edit, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { SeatingArrangement, formatDepartmentsWithYears } from "@/utils/reportUtils";
import { DetailedReportView } from "./DetailedReportView";
import { SeatingGridPreview } from "./SeatingGridPreview";
import { useNavigate } from "react-router-dom";
import { getHallNameById } from "@/utils/hallUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  // Group arrangements by hall
  const hallGroups = arrangements.reduce((acc, arrangement) => {
    // Get the hall ID either from arrangement.hall_id or derive it from room number
    const hallId = arrangement.hall_id || (() => {
      const roomFirstDigit = arrangement.room_no.charAt(0);
      return roomFirstDigit === '1' ? '1' : 
             roomFirstDigit === '2' ? '2' : '3';
    })();
    
    const hallName = arrangement.hall_name || getHallNameById(hallId);
    
    if (!acc[hallId]) {
      acc[hallId] = { name: hallName, arrangements: [] };
    }
    
    acc[hallId].arrangements.push(arrangement);
    return acc;
  }, {} as Record<string, { name: string, arrangements: SeatingArrangement[] }>);

  // Group arrangements by department and year using the utility function
  const groupedArrangements = arrangements.reduce((acc, arrangement) => {
    return {
      ...acc,
      [arrangement.id]: formatDepartmentsWithYears(arrangement)
    };
  }, {} as Record<string, string>);

  return (
    <div className="space-y-8">
      {Object.entries(hallGroups).map(([hallId, { name, arrangements }]) => (
        <Card key={hallId} className="overflow-hidden mb-8">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-slate-600" />
                <CardTitle>{name}</CardTitle>
              </div>
              <Badge variant="outline" className="bg-slate-100">
                {arrangements.length} {arrangements.length === 1 ? 'Room' : 'Rooms'}
              </Badge>
            </div>
            <CardDescription>
              {arrangements.reduce((total, arr) => total + arr.seating_assignments.length, 0)} students assigned
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Departments & Years</TableHead>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
