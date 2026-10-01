import { AnimatePresence, motion } from "motion/react";
import { getFileIcon } from "../utils/customizeIcon";
import { Check, Circle, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { updateFile } from "../features/file";
import MonacoEditor from "@monaco-editor/react";

function Editor({ activeTab, openTabs, setOpenTabs, setActiveTab, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // Unsaved edits, keyed by file id. A file has a draft only while it differs
  // from what was last saved, so switching tabs never loses or resets work.
  const [drafts, setDrafts] = useState({});

  const isDirty = (tab) =>
    drafts[tab._id] !== undefined &&
    drafts[tab._id] !== (tab.content ?? "");

  // `code` is derived, never copied into state. That is what stops the editor
  // content from being "refreshed" whenever activeTab changes (e.g. after save).
  const code = activeTab
    ? (drafts[activeTab._id] ?? activeTab.content ?? "")
    : "";

  const handleChange = (value) => {
    if (!activeTab) return;
    const id = activeTab._id;
    setDrafts((prev) => ({ ...prev, [id]: value ?? "" }));
  };

  const handleCloseTab = (e, id) => {
    e.stopPropagation();

    const tab = openTabs.find((t) => t._id == id);
    if (
      tab &&
      isDirty(tab) &&
      !window.confirm("This file has unsaved changes. Close it anyway?")
    ) {
      return;
    }

    const closedIndex = openTabs.findIndex((t) => t._id == id);
    const result = openTabs.filter((t) => t._id != id);
    setOpenTabs(result);
    setDrafts((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

    if (activeTab?._id == id) {
      const neighbour = result[Math.min(closedIndex, result.length - 1)];
      setActiveTab(neighbour ?? null);
    }
  };

  if (!activeTab)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-zinc-600">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Circle size={22} className="text-zinc-700" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-zinc-400">
            No File Open
          </span>
          <span className="text-xs text-zinc-600">
            Select a file from Explorer to start editing
          </span>
        </div>
      </div>
    );

  const save = async () => {
    if (!activeTab || saving) return;

    const id = activeTab._id;
    const content = code; // snapshot of exactly what is being saved

    try {
      setSaving(true);
      await updateFile({ name: activeTab.name, content, id });

      setOpenTabs((tabs) =>
        tabs.map((tab) => (tab._id == id ? { ...tab, content } : tab)),
      );
      // Functional update: don't clobber a tab the user switched to meanwhile.
      setActiveTab((current) =>
        current && current._id == id ? { ...current, content } : current,
      );
      // Only drop the draft if nothing new was typed while the request ran.
      setDrafts((prev) => {
        if (prev[id] !== content) return prev;
        const { [id]: _saved, ...rest } = prev;
        return rest;
      });
      // Keep the project tree (used by Preview and Explorer) in sync.
      onSaved?.({ ...activeTab, content });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  const ActiveIcon = getFileIcon(activeTab?.name).icon;
  const activeColor = getFileIcon(activeTab?.name).color;

  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0c]">
      <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/[0.06] bg-[#111113]/90">
        <AnimatePresence initial={false}>
          {openTabs.map((tab) => {
            const active = activeTab?._id == tab?._id;
            const { icon: Icon, color } = getFileIcon(tab?.name);
            return (
              <motion.div
                key={tab._id}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setActiveTab(tab)}
                className={`group relative flex h-full cursor-pointer items-center gap-2 whitespace-nowrap border-r border-white/[0.05] px-3.5 transition-colors ${active ? "bg-[#0a0a0c] text-white" : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300"}`}
              >
                <Icon size={14} className={`${color}`} />
                <span className="text-[13px]">{tab?.name}</span>
                {isDirty(tab) && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-sky-400"
                    title="Unsaved changes"
                  />
                )}
                <button
                  className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  onClick={(e) => handleCloseTab(e, tab?._id)}
                >
                  <X size={13} />
                </button>

                {active && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-sky-400 to-violet-400"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  ></motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <ActiveIcon size={14} className={`${activeColor}`} />
          <span className="text-[13px]">{activeTab?.name}</span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-sky-500 to-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-colors hover:from-sky-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AnimatePresence initial={false} mode="wait">
            {saving ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 size={13} className="animate-spin" />
                Saving
              </motion.span>
            ) : justSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={13} />
                Saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Save size={13} />
                Save
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          theme="vs-dark"
          // One Monaco model per file: keeps undo history and cursor per tab.
          path={String(activeTab._id)}
          language={activeTab?.language || "plaintext"}
          value={code}
          onChange={handleChange}
          options={{
            fontSize: 14,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}

export default Editor;