
import { DEFAULT_HALLS, getHallNameById as getHallNameByIdFromUtils, Hall, removeHall as removeHallFromUtils, getRoomNumbersByHallId } from './hallUtils';

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
  if (!roomNo) return '1'; // Default to Hall A if no room number provided
  
  // Check if the room number exists in any of the default halls
  for (const hall of DEFAULT_HALLS) {
    if (hall.roomNumbers && hall.roomNumbers.includes(roomNo)) {
      return hall.id;
    }
  }
  
  // If no match found, use prefix matching
  const firstChar = roomNo.charAt(0).toUpperCase();
  switch (firstChar) {
    case 'A':
      return '1'; // Hall A
    case 'B':
      return '2'; // Hall B
    case 'C':
      return '3'; // Hall C
    default:
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
  }
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

// Get available room numbers for a hall ID
export const getRoomNumbers = getRoomNumbersByHallId;
