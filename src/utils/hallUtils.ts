
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
