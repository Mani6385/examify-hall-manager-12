
export interface Hall {
  id: string;
  name: string;
}

export const DEFAULT_HALLS: Hall[] = [
  { id: 'all', name: 'All Halls' },
  { id: '1', name: 'Hall A' },
  { id: '2', name: 'Hall B' },
  { id: '3', name: 'Hall C' }
];

export const getHallNameById = (id: string): string => {
  const hall = DEFAULT_HALLS.find(hall => hall.id === id);
  return hall ? hall.name : 'Unknown Hall';
};

export const removeHall = (halls: Hall[], id: string): Hall[] => {
  return halls.filter(hall => hall.id !== id);
};
