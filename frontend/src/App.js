import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import ProductLines from "@/pages/ProductLines";
import LineDetail from "@/pages/LineDetail";
import InspectionResult from "@/pages/InspectionResult";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("ls-theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("ls-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="App">
      <BrowserRouter>
        <AppShell theme={theme} onToggleTheme={toggleTheme}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lines" element={<ProductLines />} />
            <Route path="/lines/:id" element={<LineDetail />} />
            <Route path="/inspections/:id" element={<InspectionResult />} />
          </Routes>
        </AppShell>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
