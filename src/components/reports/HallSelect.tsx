
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
import { X, Info } from "lucide-react";
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

  useEffect(() => {
    const fetchHalls = async () => {
      setIsLoading(true);
      try {
        // Try to fetch real hall data from database
        const { data, error } = await supabase
          .from('halls')
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Error fetching halls:", error);
          // If there's an error, use default halls
          setAvailableHalls(DEFAULT_HALLS);
        } else if (data && data.length > 0) {
          // Map database data to Hall interface
          const mappedHalls: Hall[] = data.map(hall => ({
            id: hall.id,
            name: hall.name,
            capacity: hall.capacity || 30
          }));
          setAvailableHalls(mappedHalls);
        } else {
          // If no data, use default halls
          setAvailableHalls(DEFAULT_HALLS);
        }
      } catch (error) {
        console.error("Failed to fetch halls:", error);
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
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, id);
    setAvailableHalls(updatedHalls);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Hall Selection</CardTitle>
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
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        {availableHalls.length === 0 && (
          <div className="flex items-center justify-center py-2 text-amber-600 text-sm">
            <Info className="h-4 w-4 mr-2" />
            <span>All halls have been removed. Refresh the page to reset.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
