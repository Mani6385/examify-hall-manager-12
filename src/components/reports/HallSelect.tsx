
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Info, Building2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Hall, DEFAULT_HALLS, removeHall, getHallNameById } from "@/utils/hallUtils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HallSelectProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
}

export function HallSelect({ selectedHall, setSelectedHall }: HallSelectProps) {
  const [availableHalls, setAvailableHalls] = useState<Hall[]>(DEFAULT_HALLS);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHalls = async () => {
      setIsLoading(true);
      try {
        // Try to fetch classes and map them to halls
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Error fetching classes:", error);
          // If there's an error, use default halls
          setAvailableHalls(DEFAULT_HALLS);
        } else if (data && data.length > 0) {
          // Map classes data to Hall interface with room numbers
          const mappedHalls: Hall[] = data.map((item, index) => ({
            id: item.id || String(index + 1),
            name: item.name || `Hall ${index + 1}`,
            capacity: parseInt(item.capacity) || 30,
            // Add sample room numbers based on the hall name
            roomNumbers: generateSampleRooms(item.name || `Hall ${index + 1}`, index + 1)
          }));
          setAvailableHalls(mappedHalls);
        } else {
          // If no data, use default halls
          setAvailableHalls(DEFAULT_HALLS);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        setAvailableHalls(DEFAULT_HALLS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHalls();
  }, []);

  // Generate sample room numbers for a hall
  const generateSampleRooms = (hallName: string, index: number): string[] => {
    const prefix = hallName.charAt(0).toUpperCase();
    const roomCount = 3 + index; // Each hall gets a different number of rooms
    
    return Array.from({ length: roomCount }, (_, i) => 
      `${prefix}${index}${String(i + 1).padStart(2, '0')}`
    );
  };

  const handleRemoveHall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If the hall being removed is currently selected, switch to "all"
    if (selectedHall === id) {
      setSelectedHall("all");
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, id);
    setAvailableHalls(updatedHalls);
    
    // Show a toast notification
    toast({
      title: "Hall Removed",
      description: `${getHallNameById(id)} has been removed from the selection.`,
    });
  };

  const handleResetHalls = () => {
    setAvailableHalls(DEFAULT_HALLS);
    toast({
      title: "Halls Reset",
      description: "All halls have been restored to defaults.",
    });
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-primary" />
          Hall Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedHall} onValueChange={setSelectedHall}>
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
                      onClick={(e) => handleRemoveHall(hall.id, e)}
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <div className="flex flex-wrap gap-2">
          {availableHalls.map((hall) => (
            <TooltipProvider key={hall.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${selectedHall === hall.id ? 'bg-primary/10 border-primary' : 'bg-background'} cursor-pointer`}
                    onClick={() => setSelectedHall(hall.id)}
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
          ))}
        </div>
        
        {availableHalls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>All halls have been removed.</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetHalls} 
              className="text-xs"
            >
              Reset Halls
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
