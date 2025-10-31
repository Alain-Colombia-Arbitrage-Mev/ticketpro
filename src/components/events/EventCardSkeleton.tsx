import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full sm:aspect-[3/4]" />
      <div className="p-4 sm:p-5">
        <Skeleton className="mb-3 h-6 w-3/4" />
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}
