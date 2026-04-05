import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-32 hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 hidden sm:block rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Welcome */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-10 w-72 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto mb-6" />
          <Skeleton className="h-10 w-40 mx-auto rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 sm:p-6 border border-border bg-card">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-2xl p-4 sm:p-6 border border-border bg-card mb-4 sm:mb-8">
          <Skeleton className="h-5 w-40 mb-6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </main>
    </div>
  );
}
