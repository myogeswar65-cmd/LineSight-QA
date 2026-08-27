import React, { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const UploadDropzone = ({
  multiple = false,
  onFiles,
  busy = false,
  title = "Drop images here",
  hint = "PNG, JPG or WEBP",
  testid = "image-upload-dropzone",
  className,
}) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length && onFiles) onFiles(multiple ? files : [files[0]]);
  };

  return (
    <div
      data-testid={testid}
      role="button"
      tabIndex={0}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) handleFiles(e.dataTransfer.files); }}
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed p-8 text-center transition-colors cursor-pointer",
        drag ? "border-primary bg-primary/5" : "border-border bg-card/60 hover:bg-muted/40",
        busy && "pointer-events-none opacity-70",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="hidden"
        data-testid={`${testid}-input`}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {busy ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
      )}
      <p className="mt-3 font-display font-semibold">{busy ? "Working…" : title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}{multiple ? " • multiple allowed" : ""}</p>
    </div>
  );
};
