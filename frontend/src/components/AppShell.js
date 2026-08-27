import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Boxes, ScanSearch, Moon, Sun, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/lines", label: "Product Lines", icon: Boxes, testid: "nav-lines" },
];

export const AppShell = ({ children, theme, onToggleTheme }) => {
  const loc = useLocation();
  return (
    <div className="app-noise relative min-h-screen">
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-border bg-card/60 backdrop-blur md:flex md:flex-col">
          <div className="flex h-16 items-center gap-2.5 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radar className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold">LineSight QA</div>
              <div className="text-[10px] text-muted-foreground">Anomaly Inspection</div>
            </div>
          </div>
          <nav data-testid="app-left-nav" className="flex flex-1 flex-col gap-1 px-3 py-4">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  data-testid={n.testid}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}
                      <Icon className="h-4 w-4" />
                      {n.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
          <div className="px-3 pb-4">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <ScanSearch className="h-3.5 w-3.5 text-primary" /> Gemini Vision
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                Self-calibrating detection. Learns “normal” from good samples only.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header data-testid="app-top-bar" className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radar className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-bold">LineSight QA</span>
            </div>
            <div className="hidden text-xs text-muted-foreground md:block">
              {loc.pathname === "/" ? "Fleet overview across all product lines" : ""}
            </div>
            <button
              data-testid="theme-toggle"
              onClick={onToggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </header>
          {/* Mobile nav */}
          <nav className="flex gap-1 border-b border-border bg-card/40 px-4 py-2 md:hidden">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <NavLink key={n.to} to={n.to} end={n.end}
                  className={({ isActive }) => cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                  <Icon className="h-3.5 w-3.5" />{n.label}
                </NavLink>
              );
            })}
          </nav>
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
