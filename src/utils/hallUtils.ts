
export interface Hall {
  id: string;
  name: string;
  capacity?: number;
}

export const DEFAULT_HALLS: Hall[] = [
  { id: 'all', name: 'All Halls' },
  { id: '1', name: 'Hall A', capacity: 30 },
  { id: '2', name: 'Hall B', capacity: 40 },
  { id: '3', name: 'Hall C', capacity: 50 }
];

export const getHallNameById = (id: string): string => {
  const hall = DEFAULT_HALLS.find(hall => hall.id === id);
  return hall ? hall.name : 'Unknown Hall';
};

export const removeHall = (halls: Hall[], id: string): Hall[] => {
  return halls.filter(hall => hall.id !== id);
};

// Add utility functions for generating printable IDs and printing elements
export const getPrintableId = (): string => {
  return `printable-${Math.random().toString(36).substring(2, 9)}`;
};

export const printElement = (elementId: string): void => {
  const printContents = document.getElementById(elementId)?.innerHTML;
  const originalContents = document.body.innerHTML;

  if (printContents) {
    document.body.innerHTML = `
      <html>
        <head>
          <title>Print</title>
          <style>
            @media print {
              body { margin: 0; padding: 15mm; }
              @page { size: auto; margin: 5mm; }
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `;

    setTimeout(() => {
      window.print();
      document.body.innerHTML = originalContents;
    }, 250);
  }
};
