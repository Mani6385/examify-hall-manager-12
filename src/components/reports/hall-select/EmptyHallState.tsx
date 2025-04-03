
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyHallStateProps {
  onReset: () => void;
}

export function EmptyHallState({ onReset }: EmptyHallStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2 space-y-2">
      <div className="flex items-center text-amber-600 text-sm">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span>All halls have been removed.</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReset} 
        className="text-xs"
      >
        Reset Halls
      </Button>
    </div>
  );
}
