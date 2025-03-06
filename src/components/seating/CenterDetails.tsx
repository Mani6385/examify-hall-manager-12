
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Hall } from "@/utils/hallUtils";

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
  halls,
}: CenterDetailsProps) => {
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
            {halls.map((hall) => (
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
    </div>
  );
};
