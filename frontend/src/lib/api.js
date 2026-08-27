import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const dataUri = (b64) => (b64 ? `data:image/jpeg;base64,${b64}` : "");

export function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const VERDICT = {
  PASS: { label: "PASS", color: "var(--pass)", tone: "emerald" },
  FAIL: { label: "FAIL", color: "var(--fail)", tone: "red" },
  UNCERTAIN: { label: "UNCERTAIN", color: "var(--uncertain)", tone: "blue" },
};

export function severityLabel(sev) {
  if (sev >= 0.66) return { key: "high", label: "High", varname: "--sev-high" };
  if (sev >= 0.33) return { key: "med", label: "Medium", varname: "--sev-med" };
  return { key: "low", label: "Low", varname: "--sev-low" };
}

export function b64ToFile(b64, name = "sample.jpg") {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: "image/jpeg" });
}
