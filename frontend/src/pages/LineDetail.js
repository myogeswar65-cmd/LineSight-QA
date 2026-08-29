import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, b64ToFile, dataUri, timeAgo, fmtDate } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { DriftBadge } from "@/components/DriftBadge";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { AnnotationCanvas } from "@/components/AnnotationCanvas";
import { UploadDropzone } from "@/components/UploadDropzone";
import { EmptyState } from "@/components/EmptyState";
import {
  ArrowLeft, CheckCircle2, CircleDashed, Sparkles, ScanSearch, History, Lightbulb,
  ImagePlus, ExternalLink, Trash2, MapPin, Layers, GitBranch, RotateCcw, Clock,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const chartTip = {
  contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))", fontSize: 12 },
};

export default function LineDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [line, setLine] = useState(null);
  const [samples, setSamples] = useState(null);
  const [tab, setTab] = useState("calibration");
  const didInit = useRef(false);

  const loadLine = useCallback(() => api.get(`/product-lines/${id}`).then((r) => setLine(r.data)), [id]);

  useEffect(() => {
    loadLine().catch(() => toast.error("Line not found"));
    api.get("/samples").then((r) => setSamples(r.data)).catch(() => {});
  }, [id, loadLine]);

  useEffect(() => {
    if (line && !didInit.current) {
      didInit.current = true;
      setTab(line.calibrated ? "inspect" : "calibration");
    }
  }, [line]);

  if (!line) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      <button data-testid="back-to-lines" onClick={() => nav("/lines")} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All lines
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {line.cover && <img src={dataUri(line.cover)} alt="" className="h-16 w-16 rounded-xl border border-border object-cover" />}
          <div>
            <h1 className="font-display text-2xl font-bold">{line.name}</h1>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{line.description || "No description"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {line.calibrated ? (
                <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-3 w-3" /> Calibrated v{line.baseline_version}</Badge>
              ) : (
                <Badge variant="secondary" className="gap-1"><CircleDashed className="h-3 w-3" /> Not calibrated</Badge>
              )}
              <span className="text-xs text-muted-foreground">{line.inspection_count} inspections</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="line-tabs" className="flex-wrap">
          <TabsTrigger value="calibration" data-testid="tab-calibration"><Sparkles className="mr-1.5 h-4 w-4" /> Calibration</TabsTrigger>
          <TabsTrigger value="inspect" data-testid="tab-inspect"><ScanSearch className="mr-1.5 h-4 w-4" /> Inspect</TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions"><GitBranch className="mr-1.5 h-4 w-4" /> Versions</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history"><History className="mr-1.5 h-4 w-4" /> History</TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-insights"><Lightbulb className="mr-1.5 h-4 w-4" /> Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="calibration" className="mt-5">
          <CalibrationTab line={line} samples={samples} onDone={loadLine} />
        </TabsContent>
        <TabsContent value="inspect" className="mt-5">
          <InspectTab line={line} samples={samples} onDone={loadLine} />
        </TabsContent>
        <TabsContent value="versions" className="mt-5">
          <VersionsTab lineId={id} onDone={loadLine} />
        </TabsContent>
        <TabsContent value="history" className="mt-5">
          <HistoryTab lineId={id} />
        </TabsContent>
        <TabsContent value="insights" className="mt-5">
          <InsightsTab lineId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- Calibration ------------------------------ */
function CalibrationTab({ line, samples, onDone }) {
  const [busy, setBusy] = useState(false);

  const calibrate = async (files) => {
    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f, i) => fd.append("files", f, f.name || `img${i}.jpg`));
      await api.post(`/product-lines/${line.id}/calibrate`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Baseline calibrated");
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Calibration failed");
    } finally { setBusy(false); }
  };

  const runDemo = () => {
    if (!samples) return;
    const files = samples.good.map((b, i) => b64ToFile(b, `good${i}.jpg`));
    calibrate(files);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold">Teach the baseline</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload several images of <strong>known-good</strong> parts. The model learns what "normal" looks like — no defect labels needed.</p>
          <div className="mt-4">
            <UploadDropzone multiple busy={busy} onFiles={calibrate} title="Drop good reference images" hint="3-5 images recommended" testid="calibrate-dropzone" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="mt-3 w-full" data-testid="calibrate-demo-button" disabled={busy || !samples} onClick={runDemo}>
            <ImagePlus className="mr-2 h-4 w-4" /> Use demo sample parts
          </Button>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5" data-testid="baseline-status-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Baseline status</h2>
            {line.calibrated ? <StatusBadge verdict="PASS" size="sm" /> : <Badge variant="secondary">Pending</Badge>}
          </div>
          {line.calibrated ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-4 gap-2" data-testid="calibration-batch-grid">
                {line.baseline_images.map((b, i) => (
                  <img key={i} src={dataUri(b)} alt="" className="aspect-square w-full rounded-md border border-border object-cover" />
                ))}
              </div>
              {line.baseline_profile && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Learned normal profile</div>
                  <p className="mt-1.5 text-sm">{line.baseline_profile.part_summary}</p>
                  {line.baseline_profile.expected_components?.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                      {line.baseline_profile.expected_components.slice(0, 5).map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  )}
                  <div className="mt-2 text-[11px] text-muted-foreground">Updated {timeAgo(line.baseline_updated_at)} • v{line.baseline_version}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Not calibrated yet. Upload good reference images to build the normal profile.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- Inspect -------------------------------- */
function InspectTab({ line, samples, onDone }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [sel, setSel] = useState(null);
  const nav = useNavigate();

  const runInspect = async (files) => {
    if (!line.calibrated) { toast.error("Calibrate this line first"); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", files[0], files[0].name || "test.jpg");
      const r = await api.post(`/product-lines/${line.id}/inspect`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data);
      onDone();
      toast[r.data.verdict === "PASS" ? "success" : "warning"](`Result: ${r.data.verdict}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Inspection failed");
    } finally { setBusy(false); }
  };

  const runDemo = (b64) => runInspect([b64ToFile(b64, "demo.jpg")]);

  if (!line.calibrated) {
    return <EmptyState icon={Sparkles} title="Calibrate first" description="This line has no baseline yet. Head to the Calibration tab and upload good reference images." />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold">Inspect a part</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a test image. The model compares it against the learned baseline and localizes any anomalies.</p>
          <div className="mt-4">
            <UploadDropzone busy={busy} onFiles={runInspect} title="Drop a test image" hint="Single image" testid="inspect-dropzone" />
          </div>
          {samples && (
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground">Or try a demo part:</div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {samples.defects.map((d, i) => (
                  <button key={i} data-testid={`demo-defect-${d.type}`} disabled={busy} onClick={() => runDemo(d.image)}
                    className="group overflow-hidden rounded-md border border-border transition-colors hover:border-primary disabled:opacity-50">
                    <img src={dataUri(d.image)} alt={d.type} className="aspect-square w-full object-cover" />
                    <div className="truncate bg-card px-1 py-0.5 text-[9px] text-muted-foreground">{d.type}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div>
        {busy ? (
          <Card className="flex h-full min-h-[320px] flex-col items-center justify-center p-6">
            <ScanSearch className="h-10 w-10 animate-pulse text-primary" />
            <p className="mt-3 font-display font-semibold">Analyzing part…</p>
            <p className="text-xs text-muted-foreground">Comparing against baseline v{line.baseline_version}</p>
          </Card>
        ) : result ? (
          <Card className="p-5" data-testid="inspect-result-card">
            <div className="flex items-center justify-between">
              <StatusBadge verdict={result.verdict} />
              <Button size="sm" variant="outline" data-testid="open-full-result" onClick={() => nav(`/inspections/${result.id}`)}>
                Full report <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-4">
              <AnnotationCanvas imageSrc={dataUri(result.image)} regions={result.regions} verdict={result.verdict} selected={sel} onSelect={setSel} />
            </div>
            <p className="mt-3 text-sm">{result.summary}</p>
            {result.uncertainty_note && <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{result.uncertainty_note}</p>}
          </Card>
        ) : (
          <Card className="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Inspection results will appear here.
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Versions -------------------------------- */
function VersionsTab({ lineId, onDone }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    api.get(`/product-lines/${lineId}/baseline-versions`).then((r) => setData(r.data));
  }, [lineId]);

  useEffect(() => { load(); }, [load]);

  const activate = async (version) => {
    setBusy(version);
    try {
      await api.post(`/product-lines/${lineId}/baseline-versions/${version}/activate`);
      toast.success(`Restored baseline v${version}`);
      load();
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Restore failed");
    } finally { setBusy(null); }
  };

  if (!data) return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  if (!data.versions.length) {
    return <EmptyState icon={GitBranch} title="No baseline versions yet" description="Every time you calibrate this line, a restorable baseline version is saved here. Calibrate it from the Calibration tab to begin." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Baseline versions</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Each calibration is saved as a version. Restore any previous baseline in one click.</p>
        </div>
        <Badge variant="secondary" className="gap-1"><Layers className="h-3 w-3" /> {data.versions.length} versions</Badge>
      </div>

      <div className="relative space-y-4 pl-6" data-testid="baseline-versions-list">
        {/* timeline rail */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
        {data.versions.map((v) => (
          <div key={v.id} className="relative" data-testid={`version-row-${v.version}`}>
            <span className={`absolute -left-[22px] top-5 h-3.5 w-3.5 rounded-full border-2 ${v.active ? "border-primary bg-primary" : "border-border bg-card"}`} />
            <Card className={`p-4 sm:p-5 transition-shadow ${v.active ? "ring-1 ring-primary/40" : ""}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold">v{v.version}</span>
                    {v.active ? (
                      <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                    ) : (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {fmtDate(v.created_at)}</span>
                    <span className="inline-flex items-center gap-1"><ImagePlus className="h-3.5 w-3.5" /> {v.sample_count} samples</span>
                    <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {v.component_count} components</span>
                    <span className="inline-flex items-center gap-1"><ScanSearch className="h-3.5 w-3.5" /> {v.inspections_used} inspections</span>
                  </div>
                  {v.part_summary && <p className="mt-2 line-clamp-2 text-sm">{v.part_summary}</p>}
                  {v.images?.length > 0 && (
                    <div className="mt-3 flex gap-1.5">
                      {v.images.slice(0, 6).map((img, i) => (
                        <img key={i} src={dataUri(img)} alt="" className="h-11 w-11 rounded-md border border-border object-cover" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {v.active ? (
                    <Button size="sm" variant="outline" disabled className="cursor-default"><CheckCircle2 className="mr-1.5 h-4 w-4" /> In use</Button>
                  ) : (
                    <Button size="sm" data-testid={`restore-version-${v.version}`} disabled={busy === v.version} onClick={() => activate(v.version)}>
                      <RotateCcw className="mr-1.5 h-4 w-4" /> {busy === v.version ? "Restoring…" : "Restore"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- History -------------------------------- */
function HistoryTab({ lineId }) {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const nav = useNavigate();

  const load = useCallback(() => {
    const q = filter === "ALL" ? "" : `?verdict=${filter}`;
    api.get(`/product-lines/${lineId}/inspections${q}`).then((r) => setItems(r.data));
  }, [lineId, filter]);

  useEffect(() => { load(); }, [load]);

  const remove = async (e, iid) => {
    e.stopPropagation();
    try { await api.delete(`/inspections/${iid}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Inspection history</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40" data-testid="history-verdict-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All verdicts</SelectItem>
            <SelectItem value="PASS">Pass</SelectItem>
            <SelectItem value="FAIL">Fail</SelectItem>
            <SelectItem value="UNCERTAIN">Uncertain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={History} title="No inspections yet" description="Run an inspection from the Inspect tab to build history here." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="inspection-history-list">
          {items.map((it) => (
            <Card key={it.id} data-testid="history-item" className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-[var(--shadow-md,0_10px_30px_rgba(16,24,40,0.10))]" onClick={() => nav(`/inspections/${it.id}`)}>
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                <img src={dataUri(it.thumb)} alt="" className="h-full w-full object-cover" />
                <div className="absolute left-2 top-2"><StatusBadge verdict={it.verdict} size="sm" /></div>
                <button onClick={(e) => remove(e, it.id)} data-testid="history-delete" className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium tabular">{Math.round(it.confidence * 100)}% conf</span>
                  <span className="text-muted-foreground">{timeAgo(it.created_at)}</span>
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{it.regions.length} region{it.regions.length !== 1 ? "s" : ""}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Insights ------------------------------- */
function InsightsTab({ lineId }) {
  const [dash, setDash] = useState(null);
  const [ins, setIns] = useState(null);

  useEffect(() => {
    api.get(`/product-lines/${lineId}/dashboard`).then((r) => setDash(r.data));
    api.get(`/product-lines/${lineId}/insights`).then((r) => setIns(r.data));
  }, [lineId]);

  if (!dash || !ins) return <div className="grid gap-4 lg:grid-cols-2">{[0,1].map(i => <Skeleton key={i} className="h-64" />)}</div>;

  if (dash.total === 0) {
    return <EmptyState icon={Lightbulb} title="No data to analyze yet" description="Run some inspections and root-cause insights, defect trends, and drift detection will appear here." />;
  }

  const hintColor = (s) => s === "high" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    : s === "medium" ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    : "border-border bg-muted/40 text-foreground";

  return (
    <div className="space-y-6">
      {/* KPI row + drift */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MiniStat label="Pass rate" value={`${dash.pass_rate}%`} />
        <MiniStat label="Fail rate" value={`${dash.fail_rate}%`} />
        <MiniStat label="Avg confidence" value={`${dash.avg_confidence}%`} />
        <Card className="flex flex-col justify-center p-4">
          <span className="text-xs font-medium text-muted-foreground">Process drift</span>
          <div className="mt-2"><DriftBadge drift={dash.drift} /></div>
        </Card>
      </div>

      <Card className="p-5" data-testid="drift-card">
        <h3 className="font-display text-sm font-semibold">Drift assessment</h3>
        <p className="mt-1 text-sm text-muted-foreground">{dash.drift.detail}</p>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>Earlier anomaly rate: <b className="text-foreground tabular">{dash.drift.prev_fail_rate}%</b></span>
          <span>Recent anomaly rate: <b className="text-foreground tabular">{dash.drift.recent_fail_rate}%</b></span>
        </div>
      </Card>

      {/* Root-cause hints */}
      <div>
        <div className="mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /><h3 className="font-display text-base font-semibold">Root-cause insights</h3></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="insights-hints">
          {ins.hints.map((h, i) => (
            <div key={i} className={`rounded-lg border p-4 ${hintColor(h.severity)}`}>
              <div className="font-display text-sm font-semibold">{h.title}</div>
              <p className="mt-1 text-sm opacity-90">{h.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold">Defect type distribution</h3>
          {ins.clusters.length === 0 ? <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No defects detected</div> : (
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ins.clusters} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="defect_type" width={90} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip {...chartTip} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {ins.clusters.map((c, i) => <Cell key={i} fill={c.avg_severity >= 66 ? "hsl(var(--sev-high))" : c.avg_severity >= 33 ? "hsl(var(--sev-med))" : "hsl(var(--sev-low))"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold">Confidence &amp; anomaly trend</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.trend} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" />
                <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip {...chartTip} />
                <Line type="monotone" dataKey="confidence" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Confidence %" />
                <Line type="monotone" dataKey="anomaly" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} name="Anomaly %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><h3 className="font-display text-sm font-semibold">Defect location heat (3×3 grid)</h3></div>
        <LocationGrid dist={ins.location_distribution} />
      </Card>
    </div>
  );
}

const MiniStat = ({ label, value }) => (
  <Card className="p-4">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="mt-1.5 font-display text-2xl font-bold tabular">{value}</div>
  </Card>
);

function LocationGrid({ dist }) {
  const cells = [
    "top-left", "top-center", "top-right",
    "middle-left", "center", "middle-right",
    "bottom-left", "bottom-center", "bottom-right",
  ];
  const map = Object.fromEntries((dist || []).map((d) => [d.location, d.count]));
  const max = Math.max(1, ...cells.map((c) => map[c] || 0));
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((c) => {
        const v = map[c] || 0;
        const intensity = v / max;
        return (
          <div key={c} className="flex aspect-video flex-col items-center justify-center rounded-lg border border-border text-xs"
            style={{ background: v ? `hsl(var(--fail) / ${0.12 + intensity * 0.5})` : "hsl(var(--muted) / 0.3)" }}>
            <span className="font-display text-lg font-bold tabular">{v}</span>
            <span className="text-[10px] text-muted-foreground">{c}</span>
          </div>
        );
      })}
    </div>
  );
}
