import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, Building2, DoorClosed, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Hall, removeHall, getRoomNumbersByHallId } from "@/utils/hallUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [roomNumbers, setRoomNumbers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHalls = async () => {
      setIsLoadingHalls(true);
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Error fetching classes:", error);
          setAvailableHalls(initialHalls);
        } else if (data && data.length > 0) {
          const mappedHalls: Hall[] = data.map((item, index) => ({
            id: item.id,
            name: item.name || `Hall ${index + 1}`,
            capacity: parseInt(item.capacity) || 30,
            roomNumbers: generateSampleRooms(item.name || `Hall ${index + 1}`, index + 1)
          }));
          setAvailableHalls(mappedHalls);
        } else {
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

  useEffect(() => {
    if (selectedHall) {
      const selectedHallRooms = availableHalls.find(h => h.id === selectedHall)?.roomNumbers || [];
      setRoomNumbers(selectedHallRooms);
      
      if (selectedHallRooms.length > 0 && (!roomNo || !selectedHallRooms.includes(roomNo))) {
        setRoomNo(selectedHallRooms[0]);
      }
    } else {
      setRoomNumbers([]);
    }
  }, [selectedHall, availableHalls]);

  const generateSampleRooms = (hallName: string, index: number): string[] => {
    const prefix = hallName.charAt(0).toUpperCase();
    const roomCount = 3 + index;
    return Array.from({ length: roomCount }, (_, i) => 
      `${prefix}${index}${String(i + 1).padStart(2, '0')}`
    );
  };

  const handleRemoveHall = (hallId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (selectedHall === hallId) {
      handleHallSelect("");
      setRoomNo("");
    }
    
    const updatedHalls = removeHall(availableHalls, hallId);
    setAvailableHalls(updatedHalls);
    
    const hallName = availableHalls.find(h => h.id === hallId)?.name || 'Hall';
    toast({
      title: "Hall Removed",
      description: `${hallName} has been removed from available halls.`,
    });
  };

  const handleRemoveRoom = (room: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (roomNo === room) {
      setRoomNo("");
    }
    
    const updatedHalls = availableHalls.map(hall => {
      if (hall.id === selectedHall && hall.roomNumbers) {
        const updatedRooms = hall.roomNumbers.filter(r => r !== room);
        return { ...hall, roomNumbers: updatedRooms };
      }
      return hall;
    });
    
    setAvailableHalls(updatedHalls);
    
    toast({
      title: "Room Removed",
      description: `Room ${room} has been removed from ${availableHalls.find(h => h.id === selectedHall)?.name || 'the hall'}.`,
    });
  };

  const handleResetHalls = () => {
    setAvailableHalls(initialHalls);
    toast({
      title: "Halls Reset",
      description: "All halls have been restored to defaults.",
    });
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 shadow-sm">
      <h3 className="font-semibold text-blue-800 flex items-center">
        <Building2 className="h-5 w-5 mr-2 text-blue-600" />
        Examination Center Details
      </h3>
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
          onValueChange={(value) => {
            handleHallSelect(value);
            setRoomNo("");
          }}
        >
          <SelectTrigger className="border-blue-200 focus:border-blue-400 flex items-center">
            <Building2 className="h-4 w-4 mr-2 text-blue-500" />
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
                  <div>
                    <span className="font-medium">{hall.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (Capacity: {hall.capacity}, Rooms: {hall.roomNumbers?.length || 0})
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select
          value={roomNo}
          onValueChange={setRoomNo}
          disabled={!selectedHall || roomNumbers.length === 0}
        >
          <SelectTrigger className="border-blue-200 focus:border-blue-400 flex items-center">
            <DoorClosed className="h-4 w-4 mr-2 text-blue-500" />
            <SelectValue placeholder="Select Room" />
          </SelectTrigger>
          <SelectContent>
            {roomNumbers.length === 0 ? (
              <SelectItem value="no-rooms" disabled>
                {selectedHall ? "No rooms available" : "Select a hall first"}
              </SelectItem>
            ) : (
              roomNumbers.map((room) => (
                <SelectItem key={room} value={room} className="flex justify-between">
                  <div className="flex items-center justify-between w-full">
                    <span>{room}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 ml-2 hover:bg-red-100 rounded-full"
                      onClick={(e) => handleRemoveRoom(room, e)}
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </SelectItem>
              ))
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
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>All halls have been removed.</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetHalls} 
              className="text-xs flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Halls
            </Button>
          </div>
        )}
      </div>

      {selectedHall && roomNumbers.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">Available Rooms in {availableHalls.find(h => h.id === selectedHall)?.name}:</p>
          <div className="flex flex-wrap gap-2">
            {roomNumbers.map((room) => (
              <Badge 
                key={room}
                variant="outline" 
                className={`${roomNo === room ? 'bg-blue-100 border-blue-300' : 'bg-background'} cursor-pointer`}
                onClick={() => setRoomNo(room)}
              >
                {room}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1 hover:bg-red-100 rounded-full"
                  onClick={(e) => handleRemoveRoom(room, e)}
                >
                  <X className="h-2 w-2 text-red-500" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
