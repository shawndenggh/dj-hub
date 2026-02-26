import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  /** Positive = upward trend, negative = downward, 0 = neutral */
  trend?: number;
  /** Show a progress bar (0-100) */
  progress?: number;
  progressLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  progress,
  progressLabel,
  icon,
  className,
}: StatsCardProps) {
  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown;

  const trendColor =
    trend === undefined || trend === 0
      ? "text-muted-foreground"
      : trend > 0
        ? "text-green-500"
        : "text-red-500";

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && (
            <span className={cn("flex items-center text-xs mb-0.5", trendColor)}>
              <TrendIcon className="h-3 w-3 mr-0.5" />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {progress !== undefined && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            {progressLabel && (
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
