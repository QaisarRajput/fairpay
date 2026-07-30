type ChartSkeletonProps = {
  height?: number;
  className?: string;
};

export function ChartSkeleton({ height = 200, className }: ChartSkeletonProps) {
  return (
    <div
      className={`chart-skeleton${className ? ` ${className}` : ''}`}
      style={{ height }}
      aria-hidden="true"
    />
  );
}
