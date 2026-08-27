import React from "react";
import { cn } from "@/lib/utils";

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-card/50 px-6 py-14 text-center", className)}>
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    {description && <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
