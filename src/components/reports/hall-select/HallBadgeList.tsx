
import { Hall } from "@/utils/hallUtils";
import { HallBadge } from "./HallBadge";

interface HallBadgeListProps {
  halls: Hall[];
  selectedHall: string;
  onSelectHall: (id: string) => void;
  onRemoveHall: (id: string, e: React.MouseEvent) => void;
}

export function HallBadgeList({
  halls,
  selectedHall,
  onSelectHall,
  onRemoveHall
}: HallBadgeListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {halls.map((hall) => (
        <HallBadge
          key={hall.id}
          hall={hall}
          isSelected={selectedHall === hall.id}
          onSelect={onSelectHall}
          onRemove={onRemoveHall}
        />
      ))}
    </div>
  );
}
