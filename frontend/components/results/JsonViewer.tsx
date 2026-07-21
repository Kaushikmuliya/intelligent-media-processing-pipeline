"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

interface JsonViewerProps {
  data: unknown;
  initialDepth?: number;
}

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);

  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (value === undefined) return <span className="text-muted-foreground">undefined</span>;
  if (typeof value === "boolean")
    return (
      <span className={value ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
        {String(value)}
      </span>
    );
  if (typeof value === "number")
    return <span className="text-sky-600 dark:text-sky-400 font-mono">{value}</span>;
  if (typeof value === "string")
    return (
      <span className="text-amber-600 dark:text-amber-400 font-mono break-all">
        &quot;{value}&quot;
      </span>
    );

  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted-foreground font-mono">[]</span>;

    return (
      <span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center gap-0.5 hover:text-foreground text-muted-foreground transition-colors focus-visible:outline-none"
          aria-label={collapsed ? "Expand array" : "Collapse array"}
        >
          {collapsed ? (
            <ChevronRight className="size-3 shrink-0" />
          ) : (
            <ChevronDown className="size-3 shrink-0" />
          )}
          <span className="font-mono text-muted-foreground text-xs">
            [{value.length}]
          </span>
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-4 border-l border-border pl-3 mt-1 space-y-1"
            >
              {value.map((item, i) => (
                <div key={i} className="text-xs">
                  <span className="text-muted-foreground font-mono">{i}: </span>
                  <JsonNode value={item} depth={depth + 1} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0)
      return <span className="text-muted-foreground font-mono">{"{}"}</span>;

    return (
      <span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center gap-0.5 hover:text-foreground text-muted-foreground transition-colors focus-visible:outline-none"
          aria-label={collapsed ? "Expand object" : "Collapse object"}
        >
          {collapsed ? (
            <ChevronRight className="size-3 shrink-0" />
          ) : (
            <ChevronDown className="size-3 shrink-0" />
          )}
          <span className="font-mono text-muted-foreground text-xs">
            {"{"}
            {entries.length}
            {"}"}
          </span>
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-4 border-l border-border pl-3 mt-1 space-y-1"
            >
              {entries.map(([k, v]) => (
                <div key={k} className="text-xs flex flex-wrap items-start gap-x-1">
                  <span className="text-violet-600 dark:text-violet-400 font-mono shrink-0">
                    &quot;{k}&quot;:
                  </span>
                  <JsonNode value={v} depth={depth + 1} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    );
  }

  return <span className="font-mono text-xs">{String(value)}</span>;
}

export function JsonViewer({ data, initialDepth = 0 }: JsonViewerProps) {
  return (
    <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs font-mono overflow-x-auto">
      <JsonNode value={data} depth={initialDepth} />
    </div>
  );
}
