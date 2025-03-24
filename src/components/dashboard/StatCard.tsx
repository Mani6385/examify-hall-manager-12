
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
    <Card className={`p-6 transition-all duration-200 hover:shadow-lg animate-slideIn ${className} overflow-hidden relative`}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full filter blur-xl bg-current"></div>
      </div>
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="rounded-full p-2 bg-current bg-opacity-10">
          <Icon className="w-8 h-8 text-current" />
        </div>
      </div>
    </Card>
  );
};
