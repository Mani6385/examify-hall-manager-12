
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hall } from "@/utils/hallUtils";

interface HallSelectDropdownProps {
  selectedHall: string;
  availableHalls: Hall[];
  isLoading: boolean;
  onSelectHall: (hall: string) => void;
  onRemoveHall: (id: string, e: React.MouseEvent) => void;
}

export function HallSelectDropdown({ 
  selectedHall, 
  availableHalls, 
  isLoading, 
  onSelectHall, 
  onRemoveHall 
}: HallSelectDropdownProps) {
  return (
    <Select value={selectedHall} onValueChange={onSelectHall}>
      <SelectTrigger className="w-full bg-white">
        <SelectValue placeholder="Select Hall" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectItem value="all">All Halls</SelectItem>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Loading halls...
          </SelectItem>
        ) : (
          availableHalls.map((hall) => (
            <SelectItem key={hall.id} value={hall.id} className="flex justify-between">
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="font-medium">{hall.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Capacity: {hall.capacity}, Rooms: {hall.roomNumbers?.length || 0})
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 ml-2 hover:bg-red-100"
                  onClick={(e) => onRemoveHall(hall.id, e)}
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
