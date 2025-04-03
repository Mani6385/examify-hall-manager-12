
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HallSelectDropdown } from "./HallSelectDropdown";
import { HallBadgeList } from "./HallBadgeList";
import { EmptyHallState } from "./EmptyHallState";
import { Hall, DEFAULT_HALLS, removeHall, getHallNameById } from "@/utils/hallUtils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
        <HallSelectDropdown
          selectedHall={selectedHall}
          availableHalls={availableHalls}
          isLoading={isLoading}
          onSelectHall={setSelectedHall}
          onRemoveHall={handleRemoveHall}
        />
        
        {availableHalls.length > 0 ? (
          <HallBadgeList
            halls={availableHalls}
            selectedHall={selectedHall}
            onSelectHall={setSelectedHall}
            onRemoveHall={handleRemoveHall}
          />
        ) : (
          <EmptyHallState onReset={handleResetHalls} />
        )}
      </CardContent>
    </Card>
  );
}
