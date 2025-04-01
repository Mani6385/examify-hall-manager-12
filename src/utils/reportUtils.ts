
import { DEFAULT_HALLS, getHallNameById as getHallNameByIdFromUtils, Hall, removeHall as removeHallFromUtils } from './hallUtils';

// Use the halls from hallUtils
export const HALLS = DEFAULT_HALLS;

export interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  student_name?: string | null;
  subject?: string | null;
  seating_arrangements?: {
    id: string;
    room_no: string;
    floor_no: string;
  };
}

export interface DepartmentConfig {
  id: string;
  department: string;
  start_reg_no: string;
  end_reg_no: string;
  prefix: string;
  // Make year explicitly optional to match database structure
  year?: string | null;
}

export interface SeatingArrangement {
  id: string;
  room_no: string;
  floor_no: string;
  rows: number;
  columns: number;
  hall_name?: string; // Added this property as optional
  hall_id?: string;   // Added for reference to the hall
  seating_assignments: {
    id: string;
    seat_no: string;
    student_name: string | null;
    reg_no: string | null;
    department: string | null;
  }[];
  department_configs: DepartmentConfig[];
}

// Helper function to filter arrangements by hall
export const filterArrangementsByHall = (
  arrangements: SeatingArrangement[],
  hallId: string
): SeatingArrangement[] => {
  if (!hallId || hallId === "all") return arrangements;
  
  return arrangements.filter(arrangement => {
    // If arrangement already has a hall_id, use that
    if (arrangement.hall_id) {
      return arrangement.hall_id === hallId;
    }
    
    // Otherwise map rooms to halls based on logic
    const roomFirstDigit = arrangement.room_no.charAt(0);
    const mappedHallId = roomFirstDigit === '1' ? '1' : 
                         roomFirstDigit === '2' ? '2' : '3';
    
    // Assign hall_name to the arrangement if it's not already set
    arrangement.hall_id = mappedHallId;
    arrangement.hall_name = getHallNameById(mappedHallId);
    
    return mappedHallId === hallId;
  });
};

// Get hall name by ID - reusing from hallUtils
export const getHallNameById = getHallNameByIdFromUtils;

// Remove hall by ID - reusing from hallUtils
export const removeHall = removeHallFromUtils;

// Helper function to format department and year information consistently
export const formatDepartmentWithYear = (department: string, year?: string | null): string => {
  if (!department) return 'Not specified';
  return year ? `${department} (${year})` : department;
};

// Helper function to extract department and year from seating arrangement
export const getDepartmentsWithYears = (arrangement: SeatingArrangement): {department: string, year: string | null}[] => {
  // Extract unique departments and years from the department configs
  return arrangement.department_configs
    .filter(config => config.department)
    .map(config => ({
      department: config.department,
      year: config.year || null
    }));
};

// Format a list of departments and years for display
export const formatDepartmentsWithYears = (arrangement: SeatingArrangement): string => {
  const departmentsWithYears = getDepartmentsWithYears(arrangement);
  
  if (departmentsWithYears.length === 0) return 'Not specified';
  
  return departmentsWithYears
    .map(item => formatDepartmentWithYear(item.department, item.year))
    .join(', ');
};
