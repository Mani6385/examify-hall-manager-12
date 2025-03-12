
import { DEFAULT_HALLS, getHallNameById as getHallNameByIdFromUtils } from './hallUtils';

// Use the halls from hallUtils
export const HALLS = DEFAULT_HALLS;

export interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  student_name?: string | null;
  subject: string | null;
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
  // year may not exist in the database
  year?: string;
}

export interface SeatingArrangement {
  id: string;
  room_no: string;
  floor_no: string;
  rows: number;
  columns: number;
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
    // Map rooms to halls (just for demonstration)
    // In a real app, this mapping would come from the database
    const roomFirstDigit = arrangement.room_no.charAt(0);
    const mappedHallId = roomFirstDigit === '1' ? '1' : 
                         roomFirstDigit === '2' ? '2' : '3';
    return mappedHallId === hallId;
  });
};

// Get hall name by ID - reusing from hallUtils
export const getHallNameById = getHallNameByIdFromUtils;
