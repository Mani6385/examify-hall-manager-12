
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Hall } from "@/utils/hallUtils";

interface HallBadgeProps {
  hall: Hall;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
}

export function HallBadge({ hall, isSelected, onSelect, onRemove }: HallBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${isSelected ? 'bg-primary/10 border-primary' : 'bg-background'} cursor-pointer`}
            onClick={() => onSelect(hall.id)}
          >
            {hall.name}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-1 hover:bg-red-100 rounded-full"
              onClick={(e) => onRemove(hall.id, e)}
            >
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">{hall.name}</p>
            <p>Capacity: {hall.capacity} seats</p>
            <p>Room Numbers: {hall.roomNumbers?.join(", ") || "None"}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
