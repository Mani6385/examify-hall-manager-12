
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
