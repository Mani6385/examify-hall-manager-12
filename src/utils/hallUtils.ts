
export interface Hall {
  id: string;
  name: string;
  capacity: number;
}

// Define some default halls since we don't have a halls table in the database
export const DEFAULT_HALLS: Hall[] = [
  { id: '1', name: 'Hall A', capacity: 30 },
  { id: '2', name: 'Hall B', capacity: 40 },
  { id: '3', name: 'Hall C', capacity: 50 }
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
export const createHall = (halls: Hall[], name: string, capacity: number): Hall[] => {
  const newId = (Math.max(...halls.map(h => parseInt(h.id))) + 1).toString();
  const newHall: Hall = { id: newId, name, capacity };
  return [...halls, newHall];
};

// Update a hall
export const updateHall = (halls: Hall[], id: string, updates: Partial<Hall>): Hall[] => {
  return halls.map(hall => 
    hall.id === id ? { ...hall, ...updates } : hall
  );
};

// Reset all halls back to default
export const resetHalls = (): Hall[] => {
  return [...DEFAULT_HALLS];
};

// Add a specific default hall if it's not already in the list
export const addDefaultHall = (halls: Hall[], hallId: string): Hall[] => {
  const defaultHall = DEFAULT_HALLS.find(h => h.id === hallId);
  if (!defaultHall) return halls;
  
  // Check if hall already exists in the list
  const hallExists = halls.some(h => h.id === hallId);
  if (hallExists) return halls;
  
  return [...halls, defaultHall];
};
