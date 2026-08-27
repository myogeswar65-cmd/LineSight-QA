import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, dataUri, fmtDate, severityLabel } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { AnnotationCanvas } from "@/components/AnnotationCanvas";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, AlertTriangle, FileWarning, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

export default function InspectionResult() {
  const { id } = useParams();
  const nav = useNavigate();
  const [insp, setInsp] = useState(null);
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get(`/inspections/${id}`).then((r) => setInsp(r.data)).catch(() => setErr(true));
  }, [id]);

  if (err) {
    return <EmptyState icon={FileWarning} title="Inspection not found" description="This inspection may have been deleted." action={<Button onClick={() => nav("/lines")}>Back to lines</Button>} />;
  }
  if (!insp) {
    return <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <button data-testid="back-button" onClick={() => nav(`/lines/${insp.product_line_id}`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {insp.line_name}
      </button>

      {/* sticky verdict header */}
      <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card/90 p-4 backdrop-blur" data-testid="result-verdict-header">
        <div className="flex items-center gap-3">
          <StatusBadge verdict={insp.verdict} />
          <div>
            <div className="font-display text-sm font-semibold">{insp.line_name}</div>
            <div className="text-xs text-muted-foreground">{fmtDate(insp.created_at)} • baseline v{insp.baseline_version}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="font-display font-bold tabular">{Math.round(insp.confidence * 100)}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Anomaly</div>
            <div className="font-display font-bold tabular">{Math.round(insp.anomaly_score * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <Card className="p-3 sm:p-4">
            <AnnotationCanvas imageSrc={dataUri(insp.image)} regions={insp.regions} verdict={insp.verdict} selected={sel} onSelect={setSel} />
            <p className="mt-3 flex items-start gap-2 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{insp.summary}</span>
            </p>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <ConfidenceGauge value={insp.confidence * 100} />
          </Card>

          {insp.uncertainty_note && (
            <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40" data-testid="uncertainty-note">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200"><AlertTriangle className="h-4 w-4" /> Uncertainty</div>
              <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/90">{insp.uncertainty_note}</p>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="mb-2 font-display text-sm font-semibold">Detected regions ({insp.regions.length})</h3>
            {insp.regions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <p className="text-sm text-muted-foreground">No anomalies detected. This part matches the learned baseline.</p>
              </div>
            ) : (
              <Table data-testid="inspection-regions-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Conf.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insp.regions.map((r, i) => {
                    const sev = severityLabel(r.severity || 0.5);
                    return (
                      <TableRow
                        key={i}
                        data-testid="inspection-region-row"
                        onMouseEnter={() => setSel(i)}
                        onMouseLeave={() => setSel(null)}
                        onClick={() => setSel(i)}
                        className={sel === i ? "bg-muted/60" : "cursor-pointer"}
                      >
                        <TableCell>
                          <div className="font-medium capitalize">{r.defect_type}</div>
                          <div className="line-clamp-2 text-xs text-muted-foreground">{r.description}</div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(var(${sev.varname}))` }} />
                            {sev.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular text-xs">{Math.round((r.region_confidence || 0) * 100)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
