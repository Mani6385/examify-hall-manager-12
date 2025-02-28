
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HALLS } from "@/utils/reportUtils";

interface HallSelectProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
}

export function HallSelect({ selectedHall, setSelectedHall }: HallSelectProps) {
  return (
    <Select value={selectedHall} onValueChange={setSelectedHall}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select Hall" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Halls</SelectItem>
        {HALLS.map((hall) => (
          <SelectItem key={hall.id} value={hall.id}>
            {hall.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
