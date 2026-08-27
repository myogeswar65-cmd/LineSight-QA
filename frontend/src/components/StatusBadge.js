import React from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP = {
  PASS: {
    icon: CheckCircle2,
    label: "PASS",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
    testid: "status-badge-pass",
  },
  FAIL: {
    icon: XCircle,
    label: "FAIL",
    cls: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900",
    testid: "status-badge-fail",
  },
  UNCERTAIN: {
    icon: HelpCircle,
    label: "UNCERTAIN",
    cls: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
    testid: "status-badge-uncertain",
  },
};

export const StatusBadge = ({ verdict, size = "md", className }) => {
  const m = MAP[verdict] || MAP.UNCERTAIN;
  const Icon = m.icon;
  const sizes = size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      data-testid={m.testid}
      className={cn(
        "inline-flex items-center rounded-full border font-semibold font-display tracking-wide",
        sizes, m.cls, className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {m.label}
    </span>
  );
};
