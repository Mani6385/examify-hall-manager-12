
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Hall, removeHall, getRoomNumbersByHallId } from "@/utils/hallUtils";
import { supabase } from "@/integrations/supabase/client";

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
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState<string[]>([]);
  
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
          const mappedHalls: Hall[] = data.map((item) => {
            // Create a few default room numbers based on the hall name
            const defaultRoomNumbers = [
              `${item.name}-Room1`,
              `${item.name}-Room2`,
              `${item.name}-Room3`
            ];
            
            return {
              id: item.id,
              name: item.name || 'Unnamed Hall',
              capacity: parseInt(item.capacity) || 30,
              roomNumbers: defaultRoomNumbers
            };
          });
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

  // Update available room numbers when selected hall changes
  useEffect(() => {
    if (selectedHall) {
      const roomNumbers = getRoomNumbersByHallId(selectedHall);
      setAvailableRoomNumbers(roomNumbers);
      
      // If there are room numbers and current room is not in the list, reset it
      if (roomNumbers.length > 0 && !roomNumbers.includes(roomNo)) {
        setRoomNo(roomNumbers[0] || '');
      }
    } else {
      setAvailableRoomNumbers([]);
    }
  }, [selectedHall, roomNo, setRoomNo]);

  const handleRemoveHall = (hallId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If the hall being removed is currently selected, reset selection
    if (selectedHall === hallId) {
      handleHallSelect("");
      setRoomNo("");
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, hallId);
    setAvailableHalls(updatedHalls);
  };

  const handleCenterChange = (value: string) => {
    setCenterName(value);
    const center = examCenters.find(c => c.name === value);
    if (center) {
      setCenterCode(center.code);
      
      // Reset hall and room selection when center changes
      handleHallSelect("");
      setRoomNo("");
      setFloorNo("");
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 shadow-sm">
      <h3 className="font-semibold text-blue-800">Examination Center Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          value={centerName} 
          onValueChange={handleCenterChange}
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
          <SelectContent>
            {isLoadingHalls ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading halls...</span>
              </div>
            ) : (
              availableHalls.map((hall) => (
                <SelectItem key={hall.id} value={hall.id}>
                  {hall.name} (Capacity: {hall.capacity})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select 
          value={roomNo} 
          onValueChange={setRoomNo}
          disabled={!selectedHall || availableRoomNumbers.length === 0}
        >
          <SelectTrigger className="border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Select Room Number" />
          </SelectTrigger>
          <SelectContent>
            {availableRoomNumbers.length > 0 ? (
              availableRoomNumbers.map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                {selectedHall ? "No rooms available" : "Select a hall first"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Input
          placeholder="Floor Number"
          value={floorNo}
          onChange={(e) => setFloorNo(e.target.value)}
          className="border-blue-200 focus:border-blue-400"
        />

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
        {availableHalls.length === 0 && (
          <div className="flex items-center text-xs text-amber-600 mt-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            <p>All halls have been removed. Refresh the page to reset.</p>
          </div>
        )}
      </div>
    </div>
  );
};
