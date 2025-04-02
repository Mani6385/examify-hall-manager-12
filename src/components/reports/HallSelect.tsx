
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
import { X, Info, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Hall, DEFAULT_HALLS, removeHall, getHallNameById } from "@/utils/hallUtils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface HallSelectProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
}

export function HallSelect({ selectedHall, setSelectedHall }: HallSelectProps) {
  const [availableHalls, setAvailableHalls] = useState<Hall[]>(DEFAULT_HALLS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>("");
  const [roomNumbers, setRoomNumbers] = useState<Record<string, string[]>>({});

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
          
          // Also set room numbers from default halls
          const defaultRoomNumbers: Record<string, string[]> = {};
          DEFAULT_HALLS.forEach(hall => {
            defaultRoomNumbers[hall.id] = hall.roomNumbers || [];
          });
          setRoomNumbers(defaultRoomNumbers);
        } else if (data && data.length > 0) {
          // Map classes data to Hall interface
          const mappedHalls: Hall[] = data.map((item, index) => {
            const roomNums = item.room_numbers?.split(',') || [];
            return {
              id: item.id || String(index + 1),
              name: item.name || `Hall ${index + 1}`,
              capacity: parseInt(item.capacity) || 30,
              roomNumbers: roomNums
            };
          });
          
          setAvailableHalls(mappedHalls);
          
          // Set room numbers
          const mappedRoomNumbers: Record<string, string[]> = {};
          mappedHalls.forEach(hall => {
            mappedRoomNumbers[hall.id] = hall.roomNumbers || [];
          });
          setRoomNumbers(mappedRoomNumbers);
        } else {
          // If no data, use default halls
          setAvailableHalls(DEFAULT_HALLS);
          
          // Also set room numbers from default halls
          const defaultRoomNumbers: Record<string, string[]> = {};
          DEFAULT_HALLS.forEach(hall => {
            defaultRoomNumbers[hall.id] = hall.roomNumbers || [];
          });
          setRoomNumbers(defaultRoomNumbers);
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

  const handleRemoveHall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If the hall being removed is currently selected, switch to "all"
    if (selectedHall === id) {
      setSelectedHall("all");
      setSelectedRoomNumber("");
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, id);
    setAvailableHalls(updatedHalls);
  };

  // Handle hall selection change
  const handleHallChange = (value: string) => {
    setSelectedHall(value);
    setSelectedRoomNumber(""); // Reset room selection when hall changes
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Hall Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedHall} onValueChange={handleHallChange}>
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
                    <span>{hall.name} - Capacity: {hall.capacity}</span>
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
        
        {selectedHall && selectedHall !== "all" && roomNumbers[selectedHall]?.length > 0 && (
          <Select 
            value={selectedRoomNumber} 
            onValueChange={setSelectedRoomNumber}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select Room Number (Optional)" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="">All Rooms</SelectItem>
              {roomNumbers[selectedHall].map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <div className="flex flex-wrap gap-2">
          {availableHalls.map((hall) => (
            <TooltipProvider key={hall.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${selectedHall === hall.id ? 'bg-primary/10 border-primary' : 'bg-background'} cursor-pointer`}
                    onClick={() => handleHallChange(hall.id)}
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
                    {hall.roomNumbers && hall.roomNumbers.length > 0 && (
                      <p>Rooms: {hall.roomNumbers.join(', ')}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        {availableHalls.length === 0 && (
          <div className="flex items-center justify-center py-2 text-amber-600 text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span>All halls have been removed. Refresh the page to reset.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
