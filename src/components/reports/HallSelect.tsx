
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
import { X, Info, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Hall, DEFAULT_HALLS, removeHall, getHallNameById, addDefaultHall, resetHalls } from "@/utils/hallUtils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface HallSelectProps {
  selectedHall: string;
  setSelectedHall: (hall: string) => void;
}

export function HallSelect({ selectedHall, setSelectedHall }: HallSelectProps) {
  const [availableHalls, setAvailableHalls] = useState<Hall[]>(DEFAULT_HALLS);
  const [isLoading, setIsLoading] = useState(false);
  const [removedHalls, setRemovedHalls] = useState<Hall[]>([]);
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
          // Map classes data to Hall interface
          const mappedHalls: Hall[] = data.map((item, index) => ({
            id: item.id || String(index + 1),
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
    
    // Store the removed hall
    const hallToRemove = availableHalls.find(h => h.id === id);
    if (hallToRemove) {
      setRemovedHalls(prev => [...prev, hallToRemove]);
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, id);
    setAvailableHalls(updatedHalls);
    
    toast({
      title: "Hall Removed",
      description: `${getHallNameById(id)} has been removed from the selection.`
    });
  };

  const handleAddHall = (hallId: string) => {
    // Add the hall back to available halls
    const updatedHalls = addDefaultHall(availableHalls, hallId);
    setAvailableHalls(updatedHalls);
    
    // Remove it from the removed halls list
    setRemovedHalls(prev => prev.filter(h => h.id !== hallId));
    
    toast({
      title: "Hall Added",
      description: `${getHallNameById(hallId)} has been added back to the selection.`
    });
  };

  const handleResetHalls = () => {
    setAvailableHalls(resetHalls());
    setRemovedHalls([]);
    toast({
      title: "Halls Reset",
      description: "All halls have been restored to default."
    });
  };

  // Get the list of default halls that are currently removed
  const missingDefaultHalls = DEFAULT_HALLS.filter(
    defaultHall => !availableHalls.some(hall => hall.id === defaultHall.id)
  );

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
        
        {missingDefaultHalls.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Add removed halls:</p>
            <div className="flex flex-wrap gap-2">
              {missingDefaultHalls.map((hall) => (
                <Badge 
                  key={hall.id}
                  variant="outline" 
                  className="bg-gray-100 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleAddHall(hall.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {hall.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {availableHalls.length === 0 && (
          <div className="flex items-center justify-center py-2 text-amber-600 text-sm">
            <Info className="h-4 w-4 mr-2" />
            <span>All halls have been removed.</span>
            <Button
              variant="link"
              size="sm"
              className="pl-1 text-blue-600"
              onClick={handleResetHalls}
            >
              Reset halls
            </Button>
          </div>
        )}
        
        {availableHalls.length > 0 && availableHalls.length < DEFAULT_HALLS.length && (
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleResetHalls}
            >
              Reset to default halls
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
