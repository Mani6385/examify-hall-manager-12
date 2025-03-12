
import { ToastProps } from "@/components/ui/toast";
import { toast as toastFunction } from "@/hooks/use-toast";

export interface DepartmentConfig {
  id: string;
  department: string;
  startRegNo: string;
  endRegNo: string;
  prefix: string;
  year?: string;
}

export interface Student {
  name: string;
  regNo: string;
  department: string;
  subjectCode?: string;
  subjectName: string;
  seatNo: string;
}

export const prefixExists = (departments: DepartmentConfig[], prefix: string): boolean => {
  return departments.some(dept => dept.prefix === prefix);
};

export const addDepartmentSeries = (
  departments: DepartmentConfig[],
  prefix: string,
  { toast }: { toast: typeof toastFunction }
): DepartmentConfig[] => {
  if (prefixExists(departments, prefix)) {
    toast({
      title: "Error",
      description: `A ${prefix} series department already exists`,
      variant: "destructive",
    });
    return departments;
  }
  
  const newId = (Math.max(...departments.map(d => parseInt(d.id))) + 1).toString();
  const newDepartments = [...departments, {
    id: newId,
    department: '',
    startRegNo: '',
    endRegNo: '',
    prefix: prefix
  }];

  toast({
    title: "Success",
    description: `Added new department to ${prefix} series`,
  });

  return newDepartments;
};

export const removeDepartment = (
  departments: DepartmentConfig[],
  id: string,
  { toast }: { toast: typeof toastFunction }
): DepartmentConfig[] => {
  const targetDept = departments.find(d => d.id === id);
  if (!targetDept) return departments;
  
  const newDepartments = departments.filter(d => d.id !== id);
  
  toast({
    title: "Success",
    description: `Removed department from ${targetDept.prefix} series`,
  });

  return newDepartments;
};

export const updateDepartment = (
  departments: DepartmentConfig[],
  id: string,
  field: keyof DepartmentConfig,
  value: string
): DepartmentConfig[] => {
  return departments.map(dept => 
    dept.id === id ? { ...dept, [field]: value } : dept
  );
};
