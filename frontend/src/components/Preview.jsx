import { AlertTriangle, RefreshCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// File types the preview can't run (no bundler / module loader in the iframe).
const UNSUPPORTED_EXTS = ["jsx", "ts", "tsx", "mjs"];

// Injected into the preview page so runtime errors show up in the panel below
// the iframe. The iframe is sandboxed, so it reports via postMessage.
const CAPTURE_SCRIPT = `<script>
(function () {
  function send(level, text) {
    try {
      parent.postMessage({ __devverse: "console", level: level, text: String(text) }, "*");
    } catch (e) {}
  }
  window.addEventListener("error", function (e) {
    send("error", e.message + (e.lineno ? " (line " + e.lineno + ")" : ""));
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    send("error", "Unhandled promise rejection: " + (r && r.message ? r.message : r));
  });
  var original = console.error;
  console.error = function () {
    send("error", Array.prototype.map.call(arguments, String).join(" "));
    original.apply(console, arguments);
  };
})();
<\/script>`;

function Preview({ tree }) {
  const iframeRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [logs, setLogs] = useState([]);

  const { srcDoc, unsupported } = useMemo(() => {
    let html = "";
    let css = "";
    let js = "";
    const unsupportedFound = new Set();
    const walk = (items = []) => {
      for (const item of items) {
        if (item.type == "file") {
          if (item.name == "index.html") html = item.content || "";
          if (item.name.endsWith(".css")) css += item.content || "";
          if (item.name.endsWith(".js")) js += item.content || "";

          const ext = item.name.includes(".")
            ? item.name.split(".").pop().toLowerCase()
            : "";
          if (UNSUPPORTED_EXTS.includes(ext)) unsupportedFound.add(`.${ext}`);
        }
        if (item.children?.length) walk(item.children);
      }
    };
    walk(tree);
    const unsupportedList = [...unsupportedFound];

    if (!html) {
      return {
        unsupported: unsupportedList,
        srcDoc: `
      <!DOCTYPE html>
      <html>
      <body style="
      margin:0; 
      background:#0a0a0c; 
      color:#999; 
      font-family:Arial,sans-serif; 
      display:flex; 
      align-items:center; 
      justify-content:center; 
      height:100vh;
      "> 
      <div style="text-align:center;"> 
      <h3 style="margin:0 0 6px;">No index.html found</h3> 
      <p style="margin:0;font-size:13px;color:#666;">Create an HTML project to see the preview.</p> 
      </div> 
      </body> 
      </html>
      `,
      };
    }
    if (css) {
      const style = `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`;
      html = html.includes("</head>")
        ? html.replace("</head>", () => `${style}</head>`)
        : style + html;
    }

    if (js) {
      const script = `<script>\n${js.replace(/<\/script/gi, "<\\/script")}\n<\/script>`;
      html = html.includes("</body>")
        ? html.replace("</body>", () => `${script}</body>`)
        : html + script;
    }

    // Add the error reporter as early as possible (right after <head> or
    // <body>) without ever putting anything before the doctype.
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (tag) => tag + CAPTURE_SCRIPT);
    } else if (/<body[^>]*>/i.test(html)) {
      html = html.replace(/<body[^>]*>/i, (tag) => tag + CAPTURE_SCRIPT);
    } else {
      html += CAPTURE_SCRIPT;
    }

    return { srcDoc: html, unsupported: unsupportedList };
  }, [tree]);

  // Start with a clean console whenever the page reloads.
  useEffect(() => {
    setLogs([]);
  }, [srcDoc, reloadKey]);

  // Receive errors from the iframe (only from *our* iframe).
  useEffect(() => {
    const onMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.__devverse !== "console") return;
      setLogs((prev) => [...prev.slice(-49), String(data.text)]);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 bg-[#111113] px-4">
        <div
          className="flex items-center gap-2"
          title="Runs in a sandbox: localStorage, cookies and same-origin requests are unavailable."
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-300">Preview</span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {unsupported.length > 0 && (
            <span
              className="flex min-w-0 items-center gap-1 truncate text-[11px] text-amber-400"
              title="These file types can't run in the preview (no bundler)."
            >
              <AlertTriangle size={12} className="shrink-0" />
              <span className="truncate">
                Not previewed: {unsupported.join(", ")}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload preview"
            aria-label="Reload preview"
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCcw size={13} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-white">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          title="Project Preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-modals"
          className="h-full w-full border-0"
        />
      </div>

      {logs.length > 0 && (
        <div className="max-h-36 shrink-0 overflow-y-auto border-t border-white/10 bg-[#111113] text-[12px]">
          <div className="sticky top-0 flex items-center justify-between bg-[#111113] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-400">
            <span>
              {logs.length} error{logs.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setLogs([])}
              aria-label="Clear errors"
              className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
          <ul className="space-y-1 px-3 pb-2 font-mono text-red-300">
            {logs.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap break-words">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Preview;