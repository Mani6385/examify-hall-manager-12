
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { Hall, removeHall } from "@/utils/hallUtils";

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

  const handleRemoveHall = (hallId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If the hall being removed is currently selected, reset selection
    if (selectedHall === hallId) {
      handleHallSelect("");
    }
    
    // Remove the hall from available halls
    const updatedHalls = removeHall(availableHalls, hallId);
    setAvailableHalls(updatedHalls);
  };

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
          <SelectContent>
            {availableHalls.map((hall) => (
              <SelectItem key={hall.id} value={hall.id}>
                {hall.name} (Capacity: {hall.capacity})
              </SelectItem>
            ))}
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
        {availableHalls.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">All halls have been removed. Refresh the page to reset.</p>
        )}
      </div>
    </div>
  );
};
