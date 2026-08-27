import React from "react";
import { severityLabel } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Renders the inspected image with normalized bounding-box overlays.
 * regions: [{bbox:[x,y,w,h], severity, defect_type, region_confidence}]
 */
export const AnnotationCanvas = ({ imageSrc, regions = [], selected, onSelect, verdict }) => {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--radius)] border border-border"
      style={{ background: "hsl(var(--canvas-bg))" }}
      data-testid="annotation-canvas"
    >
      {imageSrc ? (
        <img src={imageSrc} alt="Inspected part" className="block w-full h-auto select-none" draggable={false} />
      ) : (
        <div className="aspect-square w-full" />
      )}
      {regions.map((r, i) => {
        const [x, y, w, h] = r.bbox;
        const sev = severityLabel(r.severity || 0.5);
        const isUncertain = verdict === "UNCERTAIN";
        const isSel = selected === i;
        const color = `hsl(var(${sev.varname}))`;
        return (
          <button
            type="button"
            key={i}
            data-testid={`annotation-box-${i}`}
            onMouseEnter={() => onSelect && onSelect(i)}
            onMouseLeave={() => onSelect && onSelect(null)}
            onClick={() => onSelect && onSelect(i)}
            className="absolute group"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
              border: `${isSel ? 3 : 2}px ${isUncertain ? "dashed" : "solid"} ${color}`,
              borderRadius: 8,
              boxShadow: isSel ? `0 0 0 3px ${color}33` : "none",
              background: isSel ? `${color}18` : "transparent",
              cursor: "pointer",
              transition: "box-shadow 120ms, background 120ms",
            }}
          >
            <span
              className={cn(
                "absolute -top-1 left-0 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur",
                isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              style={{ background: "hsl(var(--canvas-bg) / 0.82)", border: `1px solid ${color}` }}
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: color }} />
              {r.defect_type} • {sev.label} • {Math.round((r.region_confidence || 0) * 100)}%
            </span>
          </button>
        );
      })}
    </div>
  );
};
