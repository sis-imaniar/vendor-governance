import { RiskLevel } from "@/lib/types";
import { riskLevelColor, formatLabel } from "@/lib/utils";

interface RiskBadgeProps {
  level: RiskLevel;
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${riskLevelColor(level)}`}
    >
      {formatLabel(level)}
    </span>
  );
}
