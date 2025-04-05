
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { DepartmentConfig } from "@/utils/departmentUtils";

interface DepartmentConfigProps {
  departments: DepartmentConfig[];
  addASeries: () => void;
  addBSeries: () => void;
  addCSeries: () => void;
  addDSeries: () => void;
  addESeries: () => void;
  addFSeries: () => void;
  removeDepartment: (id: string) => void;
  updateDepartment: (id: string, field: keyof DepartmentConfig, value: string) => void;
  groupedSubjects: Record<string, any[]>;
}

export const DepartmentConfiguration = ({
  departments,
  addASeries,
  addBSeries,
  addCSeries,
  addDSeries,
  addESeries,
  addFSeries,
  removeDepartment,
  updateDepartment,
  groupedSubjects,
}: DepartmentConfigProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-blue-800">Department Configuration</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={addASeries}
            className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add A Series
          </Button>
          <Button 
            variant="outline" 
            onClick={addBSeries}
            className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add B Series
          </Button>
          <Button 
            variant="outline" 
            onClick={addCSeries}
            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:border-green-400 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add C Series
          </Button>
          <Button 
            variant="outline" 
            onClick={addDSeries}
            className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-400 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add D Series
          </Button>
          <Button 
            variant="outline" 
            onClick={addESeries}
            className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:border-red-400 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add E Series
          </Button>
          <Button 
            variant="outline" 
            onClick={addFSeries}
            className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-400 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add F Series
          </Button>
        </div>
      </div>

      {departments.map((dept, index) => (
        <div key={dept.id} className={`p-6 rounded-lg border shadow-sm transition-all hover:shadow-md ${
          dept.prefix === 'A' 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
            : dept.prefix === 'B'
              ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
              : dept.prefix === 'C'
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                : dept.prefix === 'D'
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                  : dept.prefix === 'E'
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                    : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-blue-800">
              Department {index + 1} 
              <span className={`ml-2 px-2 py-1 rounded-md text-sm ${
                dept.prefix === 'A' 
                  ? 'bg-blue-100 text-blue-700' 
                  : dept.prefix === 'B'
                    ? 'bg-purple-100 text-purple-700'
                    : dept.prefix === 'C'
                      ? 'bg-green-100 text-green-700'
                      : dept.prefix === 'D'
                        ? 'bg-yellow-100 text-yellow-700'
                        : dept.prefix === 'E'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-indigo-100 text-indigo-700'
              }`}>
                {dept.prefix} Series
              </span>
            </h3>
            <Button
              variant="outline"
              size="icon"
              onClick={() => removeDepartment(dept.id)}
              className="hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select 
              value={dept.department} 
              onValueChange={(value) => updateDepartment(dept.id, 'department', value)}
            >
              <SelectTrigger className="border-blue-200 focus:border-blue-400">
                <SelectValue placeholder="Select department and module" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedSubjects).map(([department, subjects]) => (
                  <SelectGroup key={department}>
                    <SelectLabel className="font-bold">{department}</SelectLabel>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Start Reg No"
              value={dept.startRegNo}
              onChange={(e) => updateDepartment(dept.id, 'startRegNo', e.target.value)}
              className="border-blue-200 focus:border-blue-400"
            />
            <Input
              placeholder="End Reg No"
              value={dept.endRegNo}
              onChange={(e) => updateDepartment(dept.id, 'endRegNo', e.target.value)}
              className="border-blue-200 focus:border-blue-400"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
