
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, description, className }: StatCardProps) => {
  return (
    <Card className={`p-6 transition-all duration-200 hover:shadow-lg animate-slideIn ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Icon className="w-8 h-8 text-primary opacity-80" />
      </div>
    </Card>
  );
};
