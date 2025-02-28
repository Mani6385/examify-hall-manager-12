
// Define hall data since we don't have a halls table in the database
export const HALLS = [
  { id: '1', name: 'Hall A', capacity: 30 },
  { id: '2', name: 'Hall B', capacity: 40 },
  { id: '3', name: 'Hall C', capacity: 50 }
];

export interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  student_name?: string | null;
  subject: string | null;
  seating_arrangements: {
    id: string;
    room_no: string;
    floor_no: string;
  };
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
    reg_no: string | null;
    department: string | null;
    student_name: string | null;
  }[];
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

// Get hall name by ID
export const getHallNameById = (hallId: string): string => {
  if (!hallId || hallId === "all") return 'All Halls';
  return HALLS.find(h => h.id === hallId)?.name || 'Selected Hall';
};
