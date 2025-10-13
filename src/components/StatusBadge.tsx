import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "approved" | "in-transit" | "delivered" | "processing" | "completed" | "active" | "inactive";
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  "in-transit": {
    label: "In Transit",
    className: "bg-info/10 text-info border-info/20",
  },
  delivered: {
    label: "Delivered",
    className: "bg-success/10 text-success border-success/20",
  },
  processing: {
    label: "Processing",
    className: "bg-accent/10 text-accent border-accent/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  active: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
