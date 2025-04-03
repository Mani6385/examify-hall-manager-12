
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { getHallNameById } from "@/utils/reportUtils";

interface ReportHeaderProps {
  selectedHall: string;
  totalStudents: number;
  totalRooms: number;
}

export function ReportHeader({ selectedHall, totalStudents, totalRooms }: ReportHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <CardTitle>Consolidated Reports</CardTitle>
        <CardDescription>
          Download complete seating plan for {getHallNameById(selectedHall)}
        </CardDescription>
      </div>
      <Badge variant="outline" className="px-3 py-1">
        {totalStudents} Students • {totalRooms} Rooms
      </Badge>
    </div>
  );
}
