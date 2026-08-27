import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, timeAgo } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Boxes, Plus, ScanSearch, CheckCircle2, CircleDashed, Trash2 } from "lucide-react";

export default function ProductLines() {
  const [lines, setLines] = useState(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();

  const load = () => api.get("/product-lines").then((r) => setLines(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) { toast.error("Please enter a line name"); return; }
    setSaving(true);
    try {
      const r = await api.post("/product-lines", { name, description: desc });
      toast.success("Product line created");
      setOpen(false); setName(""); setDesc("");
      nav(`/lines/${r.data.id}`);
    } catch (e) {
      toast.error("Could not create line");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/product-lines/${id}`); toast.success("Line deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Product Lines</h1>
          <p className="mt-1 text-sm text-muted-foreground">Each line learns its own “normal” baseline from good samples.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-line-button"><Plus className="mr-2 h-4 w-4" /> New Line</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create product line</DialogTitle>
              <DialogDescription>Give your line a name. You'll calibrate its normal baseline next.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ln">Line name</Label>
                <Input id="ln" data-testid="line-name-input" placeholder="e.g. CNC Bracket A" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ld">Description (optional)</Label>
                <Textarea id="ld" data-testid="line-desc-input" placeholder="What part does this line produce?" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="line-save-button" onClick={create} disabled={saving}>{saving ? "Creating…" : "Create line"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lines === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : lines.length === 0 ? (
        <EmptyState icon={Boxes} title="No product lines yet"
          description="Create a line to begin. You'll upload a few good reference images to calibrate its normal baseline."
          action={<Button data-testid="empty-create-line" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create line</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((l) => (
            <Card key={l.id} data-testid="line-card" className="group overflow-hidden transition-shadow hover:shadow-[var(--shadow-md,0_10px_30px_rgba(16,24,40,0.10))]">
              <button onClick={() => nav(`/lines/${l.id}`)} className="block w-full text-left">
                <div className="relative h-28 w-full overflow-hidden bg-muted">
                  {l.cover ? (
                    <img src={`data:image/jpeg;base64,${l.cover}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><Boxes className="h-8 w-8 text-muted-foreground/50" /></div>
                  )}
                  <div className="absolute right-2 top-2">
                    {l.calibrated ? (
                      <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-3 w-3" /> Calibrated</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><CircleDashed className="h-3 w-3" /> Not calibrated</Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-display font-semibold">{l.name}</div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{l.description || "No description"}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ScanSearch className="h-3.5 w-3.5" /> {l.inspection_count} inspections</span>
                    <span>•</span>
                    <span>Created {timeAgo(l.created_at)}</span>
                  </div>
                </div>
              </button>
              <div className="flex justify-end border-t border-border px-3 py-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button data-testid="line-delete-button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete “{l.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>This removes the line, its baseline, and all inspections. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction data-testid="confirm-delete-line" onClick={() => remove(l.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
