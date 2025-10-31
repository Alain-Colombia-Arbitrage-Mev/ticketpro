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
    <Card className="group cursor-pointer overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-500 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 hover:-translate-y-2 hover:scale-[1.02]">
      <div className={`relative p-5 sm:p-6 ${gradient} overflow-hidden`}>
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="mb-1 text-base font-semibold text-white drop-shadow-lg sm:text-lg">{title}</h3>
            <p className="text-sm font-medium text-white/90 drop-shadow-md">{count} eventos</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 group-hover:shadow-xl sm:h-14 sm:w-14">
            <Icon className="h-6 w-6 text-white drop-shadow-lg sm:h-7 sm:w-7 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </div>
    </Card>
  );
}
