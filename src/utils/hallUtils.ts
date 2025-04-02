
export interface Hall {
  id: string;
  name: string;
  capacity: number;
  roomNumbers?: string[]; // Adding roomNumbers as an optional property
}

// Define some default halls with associated room numbers
export const DEFAULT_HALLS: Hall[] = [
  { 
    id: '1', 
    name: 'Hall A', 
    capacity: 30,
    roomNumbers: ['A101', 'A102', 'A103', 'A104', 'A105']
  },
  { 
    id: '2', 
    name: 'Hall B', 
    capacity: 40,
    roomNumbers: ['B201', 'B202', 'B203', 'B204', 'B205']
  },
  { 
    id: '3', 
    name: 'Hall C', 
    capacity: 50,
    roomNumbers: ['C301', 'C302', 'C303', 'C304', 'C305']
  }
];

// Helper function to get hall by ID
export const getHallById = (hallId: string): Hall | undefined => {
  return DEFAULT_HALLS.find(hall => hall.id === hallId);
};

// Helper function to get hall name by ID
export const getHallNameById = (hallId: string): string => {
  if (!hallId || hallId === "all") return 'All Halls';
  const hall = DEFAULT_HALLS.find(h => h.id === hallId);
  return hall ? hall.name : 'Unknown Hall';
};

// Generate a unique ref ID for the printable section
export const getPrintableId = (): string => {
  return `printable-${Math.random().toString(36).substr(2, 9)}`;
};

// Function to trigger browser print for a specific element
export const printElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const originalContents = document.body.innerHTML;
  const printContents = element.innerHTML;
  
  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  
  // Reload the page to restore all event listeners
  window.location.reload();
};

// Filter halls and return a new array without the removed hall
export const removeHall = (halls: Hall[], hallIdToRemove: string): Hall[] => {
  return halls.filter(hall => hall.id !== hallIdToRemove);
};

// Get available halls (excluding removed ones)
export const getAvailableHalls = (): Hall[] => {
  return [...DEFAULT_HALLS];
};

// Create a new hall
export const createHall = (halls: Hall[], name: string, capacity: number, roomNumbers?: string[]): Hall[] => {
  const newId = (Math.max(...halls.map(h => parseInt(h.id))) + 1).toString();
  const newHall: Hall = { id: newId, name, capacity, roomNumbers };
  return [...halls, newHall];
};

// Update a hall
export const updateHall = (halls: Hall[], id: string, updates: Partial<Hall>): Hall[] => {
  return halls.map(hall => 
    hall.id === id ? { ...hall, ...updates } : hall
  );
};

// Get room numbers for a specific hall
export const getRoomNumbersByHallId = (hallId: string): string[] => {
  const hall = getHallById(hallId);
  return hall?.roomNumbers || [];
};

// Find hall ID by room number
export const getHallIdByRoomNumber = (roomNumber: string): string | undefined => {
  for (const hall of DEFAULT_HALLS) {
    if (hall.roomNumbers?.includes(roomNumber)) {
      return hall.id;
    }
  }
  return undefined;
};
