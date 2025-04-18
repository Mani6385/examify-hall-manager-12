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

// Helper function to map room number to hall ID
export const mapRoomToHallId = (roomNo: string): string => {
  // For room numbers that start with 'G' like G13, G14, etc.
  if (roomNo.startsWith('G')) {
    return '1'; // Map to Hall A
  }
  
  // For numerical room numbers, use the first digit
  const firstDigit = roomNo.charAt(0);
  if (/^\d+$/.test(firstDigit)) {
    // For rooms starting with 1, map to Hall A
    // For rooms starting with 2, map to Hall B
    // For all others, map to Hall C
    return firstDigit === '1' ? '1' : 
           firstDigit === '2' ? '2' : '3';
  }
  
  // Default to Hall C for any other format
  return '3';
};

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
    const mappedHallId = mapRoomToHallId(arrangement.room_no);
    
    // Assign hall_name and hall_id to the arrangement if they're not already set
    arrangement.hall_id = mappedHallId;
    arrangement.hall_name = getHallNameById(mappedHallId);
    
    return mappedHallId === hallId;
  });
};

// Get hall name by ID - reusing from hallUtils
export const getHallNameById = getHallNameByIdFromUtils;

// Remove hall by ID - reusing from hallUtils
export const removeHall = removeHallFromUtils;

// Format year to display as Roman numeral with "Year" text
export const formatYearDisplay = (year: string | null): string => {
  if (!year) return 'N/A';
  
  // If year is already in the correct format (e.g. "I Year"), return it
  if (year.includes('Year')) {
    return year;
  }
  
  // Otherwise, convert numeric year to Roman numeral if needed
  const yearValue = parseInt(year);
  if (!isNaN(yearValue)) {
    let romanNumeral = '';
    
    switch (yearValue) {
      case 1:
        romanNumeral = 'I';
        break;
      case 2: 
        romanNumeral = 'II';
        break;
      case 3:
        romanNumeral = 'III';
        break;
      case 4:
        romanNumeral = 'IV';
        break;
      default:
        romanNumeral = yearValue.toString();
    }
    
    return `${romanNumeral} Year`;
  }
  
  return year;
};

// Helper function to format department and year information consistently
export const formatDepartmentWithYear = (department: string, year?: string | null): string => {
  if (!department) return 'Not specified';
  return year ? `${department} (${formatYearDisplay(year)})` : department;
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
