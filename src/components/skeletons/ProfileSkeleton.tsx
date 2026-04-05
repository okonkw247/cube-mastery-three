import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl p-6 border border-border bg-card">
            <div className="flex flex-col items-center mb-8">
              <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
              <Skeleton className="h-3 w-24 mt-3" />
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
