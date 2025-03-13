
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { HALLS, removeHall } from "@/utils/reportUtils";
import { Hall } from "@/utils/hallUtils";

interface HallSelectProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
}

export function HallSelect({ selectedHall, setSelectedHall }: HallSelectProps) {
  const [availableHalls, setAvailableHalls] = useState<Hall[]>(HALLS);

  const handleRemoveHall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If the hall being removed is currently selected, switch to "all"
    if (selectedHall === id) {
      setSelectedHall("all");
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, id);
    setAvailableHalls(updatedHalls);
  };

  return (
    <div className="space-y-2">
      <Select value={selectedHall} onValueChange={setSelectedHall}>
        <SelectTrigger className="w-[240px] bg-white">
          <SelectValue placeholder="Select Hall" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All Halls</SelectItem>
          {availableHalls.map((hall) => (
            <SelectItem key={hall.id} value={hall.id} className="flex justify-between">
              <div className="flex items-center justify-between w-full">
                <span>{hall.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 ml-2 hover:bg-red-100"
                  onClick={(e) => handleRemoveHall(hall.id, e)}
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex flex-wrap gap-2">
        {availableHalls.map((hall) => (
          <Badge 
            key={hall.id} 
            variant="outline" 
            className={`${selectedHall === hall.id ? 'bg-primary/10 border-primary' : 'bg-background'}`}
          >
            {hall.name}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-1 hover:bg-red-100 rounded-full"
              onClick={(e) => handleRemoveHall(hall.id, e)}
            >
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
