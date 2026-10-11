export function Logo({ wordmark = false, stacked = false, light = false, size = 36 }: { wordmark?: boolean; stacked?: boolean; light?: boolean; size?: number }) {
  return (
    <div className={`flex min-w-0 items-center ${stacked ? "flex-col gap-3" : "gap-2.5"}`}>
      <img
        src="/favicon.svg"
        alt={wordmark ? "" : "pianoriffs"}
        width={size}
        height={size}
        className="shrink-0 border-0"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span className={`font-bold leading-none tracking-tight ${stacked ? "text-4xl sm:text-5xl" : "truncate text-[1.65rem]"}`}>
          <span className={light ? "text-slate-900" : "text-white"}>piano</span>
          <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">riffs</span>
        </span>
      )}
    </div>
  );
}
