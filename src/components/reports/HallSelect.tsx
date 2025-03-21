
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
import { X, Info, Check, School, BuildingIcon } from "lucide-react";
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
          // Map classes data to Hall interface
          const mappedHalls: Hall[] = data.map((item, index) => ({
            id: item.id,
            name: item.name || `Hall ${index + 1}`,
            capacity: parseInt(item.capacity) || 30
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
    <Card className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">Hall Selection</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedHall} onValueChange={setSelectedHall}>
          <SelectTrigger className="w-full bg-white/80 border-gray-200">
            <SelectValue placeholder="Select Hall" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[300px]">
            <SelectItem value="all" className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">All Halls</span>
                {selectedHall === "all" && <Check className="h-4 w-4 text-primary ml-2" />}
              </div>
            </SelectItem>
            
            {isLoading ? (
              <SelectItem value="loading" disabled>
                <span className="text-gray-400 italic">Loading halls...</span>
              </SelectItem>
            ) : (
              availableHalls.map((hall) => (
                <SelectItem key={hall.id} value={hall.id} className="flex justify-between">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{hall.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs bg-gray-50">
                        {hall.capacity} seats
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      {selectedHall === hall.id && <Check className="h-4 w-4 text-primary mr-2" />}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 ml-2 hover:bg-red-100 rounded-full"
                        onClick={(e) => handleRemoveHall(hall.id, e)}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <div className="flex flex-wrap gap-2 min-h-[40px] mt-3">
          <Badge 
            variant={selectedHall === "all" ? "default" : "outline"}
            className={`${
              selectedHall === "all" 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background hover:bg-gray-100'
            } cursor-pointer transition-all duration-200 py-1.5`}
            onClick={() => setSelectedHall("all")}
          >
            All Halls
          </Badge>
          
          {availableHalls.map((hall) => (
            <TooltipProvider key={hall.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={selectedHall === hall.id ? "default" : "outline"}
                    className={`${
                      selectedHall === hall.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background hover:bg-gray-100'
                    } cursor-pointer transition-all duration-200 py-1.5`}
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
                    <p className="text-gray-500">ID: {hall.id}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        {availableHalls.length === 0 && (
          <div className="flex items-center justify-center py-2 px-3 bg-amber-50 rounded-md text-amber-600 text-sm">
            <Info className="h-4 w-4 mr-2" />
            <span>All halls have been removed. Refresh the page to reset.</span>
          </div>
        )}
        
        {selectedHall !== "all" && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Selected Hall:</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {getHallNameById(selectedHall)}
                </Badge>
              </div>
              
              {availableHalls.find(hall => hall.id === selectedHall) && (
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <BuildingIcon className="h-3 w-3" />
                  <span>
                    Hall ID: {selectedHall} | 
                    Capacity: {availableHalls.find(hall => hall.id === selectedHall)?.capacity || 'N/A'} seats
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
