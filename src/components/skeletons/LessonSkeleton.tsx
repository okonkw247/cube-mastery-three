import { Skeleton } from "@/components/ui/skeleton";

export function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-300">
      {/* Video player area */}
      <div className="w-full bg-black aspect-video max-h-[70vh]">
        <Skeleton className="w-full h-full rounded-none bg-muted/20" />
      </div>

      {/* Course info */}
      <div className="w-full px-4 sm:px-6 pt-4 pb-3 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Tab bar */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-4 py-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>

      {/* Lesson list */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 flex-1">
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
