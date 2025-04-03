
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ReportFormatSettingsProps {
  detailedFormat: boolean;
  includeStudentInfo: boolean;
  onFormatChange: (checked: boolean) => void;
  onStudentInfoChange: (checked: boolean) => void;
}

export function ReportFormatSettings({
  detailedFormat,
  includeStudentInfo,
  onFormatChange,
  onStudentInfoChange
}: ReportFormatSettingsProps) {
  const { toast } = useToast();
  
  const handleFormatChange = (checked: boolean) => {
    onFormatChange(checked);
    toast({
      title: `Format updated`,
      description: `Using ${checked ? 'detailed' : 'summary'} format for reports`,
    });
  };

  const handleStudentInfoChange = (checked: boolean) => {
    onStudentInfoChange(checked);
    toast({
      description: `Student details will ${checked ? 'be included' : 'not be included'} in reports`,
    });
  };

  return (
    <div className="bg-muted/40 rounded-lg p-3 grid gap-3 sm:grid-cols-2">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Detailed Format</span>
          <span className="text-xs text-muted-foreground">Class and reg. number details</span>
        </div>
        <Switch 
          checked={detailedFormat} 
          onCheckedChange={handleFormatChange} 
        />
      </div>
      
      <div className="flex items-center justify-between space-x-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Include Student Info</span>
          <span className="text-xs text-muted-foreground">Names and registration numbers</span>
        </div>
        <Switch 
          checked={includeStudentInfo} 
          onCheckedChange={handleStudentInfoChange} 
        />
      </div>
    </div>
  );
}
