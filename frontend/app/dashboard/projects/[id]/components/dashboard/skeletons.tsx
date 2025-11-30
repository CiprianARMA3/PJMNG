export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden flex flex-col ${className}`}>
      <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded bg-white/5 animate-pulse" />
        <div className="space-y-1">
           <div className="w-24 h-3 rounded bg-white/5 animate-pulse" />
           <div className="w-16 h-2 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="w-full h-full bg-white/[0.02] rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="w-full h-80 bg-white/5 animate-pulse relative">
       <div className="absolute bottom-0 left-0 p-8 w-full flex items-end gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/10 border-4 border-[#0a0a0a]" />
          <div className="space-y-2 mb-2 w-1/2">
             <div className="h-8 bg-white/10 rounded w-1/3" />
             <div className="h-4 bg-white/10 rounded w-2/3" />
          </div>
       </div>
    </div>
  )
}