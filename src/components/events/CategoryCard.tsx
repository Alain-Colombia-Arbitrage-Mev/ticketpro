import { LucideIcon } from "lucide-react";
import { Card } from "../ui/card";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  count: string;
  gradient: string;
}

export function CategoryCard({ title, icon: Icon, count, gradient }: CategoryCardProps) {
  return (
    <Card className="group cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg">
      <div className={`relative p-5 sm:p-6 ${gradient}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-base font-semibold text-white sm:text-lg">{title}</h3>
            <p className="text-sm font-medium text-white/90">{count} eventos</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 sm:h-14 sm:w-14">
            <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </div>
        </div>
      </div>
    </Card>
  );
}
