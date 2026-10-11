export function Logo({ wordmark = false, size = 36 }: { wordmark?: boolean; size?: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img
        src="/favicon.svg"
        alt={wordmark ? "" : "pianoriffs"}
        width={size}
        height={size}
        className="shrink-0 shadow-lg shadow-indigo-500/30"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span className="truncate text-[1.65rem] font-bold leading-none tracking-tight">
          <span className="text-white">piano</span>
          <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">riffs</span>
        </span>
      )}
    </div>
  );
}
