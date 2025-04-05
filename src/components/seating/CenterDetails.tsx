
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, Plus, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Hall, removeHall, addDefaultHall, DEFAULT_HALLS, resetHalls } from "@/utils/hallUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CenterDetailsProps {
  centerName: string;
  setCenterName: (value: string) => void;
  centerCode: string;
  setCenterCode: (value: string) => void;
  selectedHall: string;
  handleHallSelect: (hallId: string) => void;
  roomNo: string;
  setRoomNo: (value: string) => void;
  floorNo: string;
  setFloorNo: (value: string) => void;
  rows: number;
  setRows: (value: number) => void;
  cols: number;
  setColumns: (value: number) => void;
  examCenters: any[];
  halls: Hall[];
}

export const CenterDetails = ({
  centerName,
  setCenterName,
  centerCode,
  setCenterCode,
  selectedHall,
  handleHallSelect,
  roomNo,
  setRoomNo,
  floorNo,
  setFloorNo,
  rows,
  setRows,
  cols,
  setColumns,
  examCenters,
  halls: initialHalls,
}: CenterDetailsProps) => {
  const [availableHalls, setAvailableHalls] = useState<Hall[]>(initialHalls);
  const [isLoadingHalls, setIsLoadingHalls] = useState(false);
  const [removedHalls, setRemovedHalls] = useState<Hall[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHalls = async () => {
      setIsLoadingHalls(true);
      try {
        // Try to fetch classes and map them to halls
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Error fetching classes:", error);
          // If there's an error, use provided halls
          setAvailableHalls(initialHalls);
        } else if (data && data.length > 0) {
          // Map classes data to Hall interface
          const mappedHalls: Hall[] = data.map((item, index) => ({
            id: item.id,
            name: item.name || `Hall ${index + 1}`,
            capacity: parseInt(item.capacity) || 30
          }));
          setAvailableHalls(mappedHalls);
        } else {
          // If no data, use provided halls
          setAvailableHalls(initialHalls);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        setAvailableHalls(initialHalls);
      } finally {
        setIsLoadingHalls(false);
      }
    };

    fetchHalls();
  }, [initialHalls]);

  const handleRemoveHall = (hallId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If the hall being removed is currently selected, reset selection
    if (selectedHall === hallId) {
      handleHallSelect("");
    }
    
    // Store the removed hall
    const hallToRemove = availableHalls.find(h => h.id === hallId);
    if (hallToRemove) {
      setRemovedHalls(prev => [...prev, hallToRemove]);
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, hallId);
    setAvailableHalls(updatedHalls);
    
    toast({
      title: "Hall Removed",
      description: `Hall has been removed from the selection.`
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
      description: `Hall has been added back to the selection.`
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
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 shadow-sm">
      <h3 className="font-semibold text-blue-800">Examination Center Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          value={centerName} 
          onValueChange={(value) => {
            setCenterName(value);
            const center = examCenters.find(c => c.name === value);
            if (center) {
              setCenterCode(center.code);
            }
          }}
        >
          <SelectTrigger className="border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Select Center" />
          </SelectTrigger>
          <SelectContent>
            {examCenters.map((center) => (
              <SelectItem key={center.id} value={center.name}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Center Code"
          value={centerCode}
          readOnly
          className="bg-white/50 border-blue-200"
        />

        <Select 
          value={selectedHall} 
          onValueChange={handleHallSelect}
        >
          <SelectTrigger className="border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Select Hall" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {isLoadingHalls ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading halls...</span>
              </div>
            ) : (
              availableHalls.map((hall) => (
                <SelectItem key={hall.id} value={hall.id} className="flex justify-between">
                  <div className="flex items-center justify-between w-full">
                    <span>{hall.name} (Capacity: {hall.capacity})</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 ml-2 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHall(hall.id, e);
                      }}
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Room Number"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            className="border-blue-200 focus:border-blue-400"
          />

          <Input
            placeholder="Floor Number"
            value={floorNo}
            onChange={(e) => setFloorNo(e.target.value)}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Rows</p>
            <Input
              type="number"
              min={1}
              max={20}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 5)}
              className="border-blue-200 focus:border-blue-400"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Columns</p>
            <Input
              type="number"
              min={1}
              max={20}
              value={cols}
              onChange={(e) => setColumns(parseInt(e.target.value) || 6)}
              className="border-blue-200 focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Available Halls:</p>
        <div className="flex flex-wrap gap-2">
          {availableHalls.map((hall) => (
            <Badge 
              key={hall.id}
              variant="outline" 
              className={`${selectedHall === hall.id ? 'bg-primary/10 border-primary' : 'bg-background'} cursor-pointer`}
              onClick={() => handleHallSelect(hall.id)}
            >
              {hall.name} - {hall.capacity} seats
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
          <div className="flex items-center justify-center py-2 text-amber-600 text-sm mt-2">
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
      </div>
    </div>
  );
};
