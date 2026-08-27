import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtDate, timeAgo } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Boxes, Gauge, ScanSearch, CheckCircle2, ArrowRight, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const Kpi = ({ icon: Icon, label, value, sub, testid }) => (
  <Card data-testid={testid} className="p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="mt-2 font-display text-3xl font-bold tabular">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/overview").then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const pieData = [
    { name: "Pass", value: data.pass, color: "hsl(var(--pass))" },
    { name: "Fail", value: data.fail, color: "hsl(var(--fail))" },
    { name: "Uncertain", value: data.uncertain, color: "hsl(var(--uncertain))" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold">Inspection Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time quality overview across all production lines.</p>
        </div>
        <Button data-testid="dashboard-go-lines" onClick={() => nav("/lines")}>
          <Boxes className="mr-2 h-4 w-4" /> Manage Lines
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi icon={Boxes} label="Product Lines" value={data.lines_count} sub={`${data.calibrated_count} calibrated`} testid="kpi-lines" />
        <Kpi icon={ScanSearch} label="Total Inspections" value={data.total_inspections} testid="kpi-inspections" />
        <Kpi icon={CheckCircle2} label="Pass Rate" value={`${data.pass_rate}%`} sub={`${data.pass} passed`} testid="kpi-passrate" />
        <Kpi icon={Gauge} label="Failures" value={data.fail} sub={`${data.uncertain} uncertain`} testid="kpi-failures" />
      </div>

      {data.lines_count === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No product lines yet"
          description="Create your first product line, calibrate it with good reference images, then start inspecting for anomalies."
          action={<Button data-testid="dashboard-empty-create" onClick={() => nav("/lines")}>Create a product line</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
          <Card className="p-5 xl:col-span-5">
            <h2 className="font-display text-base font-semibold">Verdict Distribution</h2>
            {data.total_inspections === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No inspections yet</div>
            ) : (
              <div className="mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex justify-center gap-4 text-xs">
              <Legend color="hsl(var(--pass))" label={`Pass ${data.pass}`} />
              <Legend color="hsl(var(--fail))" label={`Fail ${data.fail}`} />
              <Legend color="hsl(var(--uncertain))" label={`Uncertain ${data.uncertain}`} />
            </div>
          </Card>

          <Card className="p-5 xl:col-span-7">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Recent Inspections</h2>
            </div>
            {data.recent.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Nothing inspected yet</div>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {data.recent.map((r) => (
                  <button
                    key={r.id}
                    data-testid="dashboard-recent-row"
                    onClick={() => nav(`/inspections/${r.id}`)}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <img src={`data:image/jpeg;base64,${r.thumb}`} alt="" className="h-10 w-10 rounded-md border border-border object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.line_name}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(r.created_at)} • {Math.round(r.confidence * 100)}% conf</div>
                    </div>
                    <StatusBadge verdict={r.verdict} size="sm" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

const Legend = ({ color, label }) => (
  <span className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
  </span>
);
