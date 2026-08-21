import { VendorStatus } from "@/lib/types";
import { vendorStatusColor, formatLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: VendorStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${vendorStatusColor(status)}`}
    >
      {formatLabel(status)}
    </span>
  );
}
