import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, Circle, Loader2, Save, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateFile } from "../features/file";
import { getErrorMessage } from "../utils/errors";
import MonacoEditor from "@monaco-editor/react";
import { getFileIcon } from "../utils/customizeIcon";

const fileId = (file) => String(file?._id);

const versionChanged = (previous, current) =>
  previous?.updatedAt !== current?.updatedAt ||
  previous?.name !== current?.name ||
  previous?.content !== current?.content;

function Editor({
  activeTab,
  openTabs,
  setOpenTabs,
  setActiveTab,
  onSaved,
  onDirtyChange,
  deletedFileIds = [],
}) {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  // A draft keeps the server snapshot it was based on so a tree refresh can
  // distinguish local typing from a newer remote/AI edit.
  const [drafts, setDrafts] = useState({});
  const [conflicts, setConflicts] = useState({});
  const remoteSnapshots = useRef(new Map());
  const saveRef = useRef(null);

  const isDirty = useCallback(
    (tab) => {
      const draft = drafts[fileId(tab)];
      return draft !== undefined && draft.content !== (tab?.content ?? "");
    },
    [drafts],
  );

  const activeDraft = activeTab ? drafts[fileId(activeTab)] : null;
  const code = activeDraft?.content ?? activeTab?.content ?? "";
  const activeConflict = activeTab ? conflicts[fileId(activeTab)] : null;
  const hasDirtyTabs = openTabs.some(isDirty);

  const removeDraft = useCallback((id) => {
    setDrafts((previous) => {
      if (!(id in previous)) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  const removeConflict = useCallback((id) => {
    setConflicts((previous) => {
      if (!(id in previous)) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  const handleChange = (value) => {
    if (!activeTab) return;

    const id = fileId(activeTab);
    const content = value ?? "";
    setSaveError(null);
    setDrafts((previous) => {
      const existing = previous[id];
      return {
        ...previous,
        [id]: {
          content,
          baseContent: existing?.baseContent ?? activeTab.content ?? "",
          baseUpdatedAt: existing?.baseUpdatedAt ?? activeTab.updatedAt,
        },
      };
    });

    // If the user manually brings the draft back to the current remote copy,
    // the conflict is resolved without discarding anything unexpectedly.
    if (content === (activeTab.content ?? "")) {
      removeConflict(id);
    }
  };

  const save = useCallback(async () => {
    if (!activeTab || saving) return;

    const id = fileId(activeTab);
    const draft = drafts[id];
    const content = draft?.content ?? activeTab.content ?? "";

    if (activeConflict?.kind === "deleted") {
      setSaveError(
        "This file was deleted remotely. Copy your changes into a new file before saving.",
      );
      return;
    }

    if (activeConflict?.kind === "changed") {
      setSaveError("Resolve the remote file conflict before saving.");
      return;
    }

    setSaveError(null);

    try {
      setSaving(true);
      const savedFile = await updateFile({
        name: activeTab.name,
        content,
        expectedUpdatedAt: draft?.baseUpdatedAt ?? activeTab.updatedAt,
        id: activeTab._id,
      });
      const serverFile = savedFile || {
        ...activeTab,
        content,
      };

      setOpenTabs((tabs) =>
        tabs.map((tab) =>
          fileId(tab) === id
            ? { ...tab, ...serverFile, content: serverFile.content ?? content }
            : tab,
        ),
      );
      // Functional update: don't clobber a tab the user switched to meanwhile.
      setActiveTab((current) =>
        current && fileId(current) === id
          ? { ...current, ...serverFile, content: serverFile.content ?? content }
          : current,
      );
      remoteSnapshots.current.set(id, serverFile);
      removeConflict(id);
      // Only drop the draft if nothing new was typed while the request ran.
      setDrafts((previous) => {
        const current = previous[id];
        if (!current || current.content !== content) {
          return current
            ? {
                ...previous,
                [id]: {
                  ...current,
                  baseContent: serverFile.content ?? content,
                  baseUpdatedAt: serverFile.updatedAt,
                },
              }
            : previous;
        }

        const next = { ...previous };
        delete next[id];
        return next;
      });
      // Keep the project tree (used by Preview and Explorer) in sync with the
      // authoritative server response, including its updatedAt version.
      onSaved?.({ ...activeTab, ...serverFile, content: serverFile.content ?? content });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      const conflictFile = error?.response?.data?.file;
      if (error?.response?.status === 409 && conflictFile) {
        setConflicts((previous) => ({
          ...previous,
          [id]: { kind: "changed", remote: conflictFile },
        }));
        remoteSnapshots.current.set(id, conflictFile);
      }
      setSaveError(
        getErrorMessage(
          error,
          "Unable to save. Your changes are still here; try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }, [activeConflict, activeTab, drafts, onSaved, removeConflict, saving, setActiveTab, setOpenTabs]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    const dirtyIds = openTabs.filter(isDirty).map((tab) => fileId(tab));
    onDirtyChange?.(dirtyIds);
  }, [isDirty, onDirtyChange, openTabs]);

  useEffect(() => {
    if (deletedFileIds.length === 0) return;

    const deleted = new Set(deletedFileIds.map(String));
    // Deletion is an external event; remove its now-inaccessible drafts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([id]) => !deleted.has(id)),
      ),
    );
    setConflicts((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([id]) => !deleted.has(id)),
      ),
    );
    deleted.forEach((id) => remoteSnapshots.current.delete(id));
  }, [deletedFileIds]);

  // Observe remote tree changes without replacing a dirty local draft.
  useEffect(() => {
    const openIds = new Set(openTabs.map((tab) => fileId(tab)));

    setConflicts((previous) => {
      let next = previous;
      let changed = false;

      openTabs.forEach((tab) => {
        const id = fileId(tab);
        const draft = drafts[id];
        const previousRemote = remoteSnapshots.current.get(id);

        if (tab.remoteDeleted) {
          if (draft && isDirty(tab) && !next[id]) {
            next = { ...next, [id]: { kind: "deleted", remote: null } };
            changed = true;
          }
          return;
        }

        if (
          previousRemote &&
          versionChanged(previousRemote, tab) &&
          draft &&
          isDirty(tab) &&
          !next[id]
        ) {
          next = {
            ...next,
            [id]: { kind: "changed", remote: tab },
          };
          changed = true;
        }

        remoteSnapshots.current.set(id, tab);
      });

      for (const id of remoteSnapshots.current.keys()) {
        if (!openIds.has(id)) remoteSnapshots.current.delete(id);
      }

      return changed ? next : previous;
    });
  }, [drafts, isDirty, openTabs]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!hasDirtyTabs) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasDirtyTabs]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const discardRemoteConflict = () => {
    if (!activeTab || !activeConflict || activeConflict.kind !== "changed") {
      return;
    }

    const remote = activeConflict.remote;
    const id = fileId(activeTab);
    removeDraft(id);
    removeConflict(id);
    remoteSnapshots.current.set(id, remote);
    setOpenTabs((tabs) =>
      tabs.map((tab) => (fileId(tab) === id ? { ...tab, ...remote } : tab)),
    );
    setActiveTab((current) =>
      current && fileId(current) === id ? { ...current, ...remote } : current,
    );
    onSaved?.(remote);
    setSaveError(null);
  };

  const keepLocalConflict = () => {
    if (!activeTab || !activeConflict || activeConflict.kind !== "changed") {
      return;
    }

    const id = fileId(activeTab);
    const remote = activeConflict.remote;
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        baseContent: remote.content ?? "",
        baseUpdatedAt: remote.updatedAt,
      },
    }));
    removeConflict(id);
    setSaveError("Remote version acknowledged. Save again to keep your changes.");
  };

  const handleCloseTab = (event, id) => {
    event.stopPropagation();

    const tab = openTabs.find((item) => fileId(item) === String(id));
    if (
      tab &&
      isDirty(tab) &&
      !window.confirm("This file has unsaved changes. Close it anyway?")
    ) {
      return;
    }

    const closedIndex = openTabs.findIndex((item) => fileId(item) === String(id));
    const result = openTabs.filter((item) => fileId(item) !== String(id));
    setOpenTabs(result);
    removeDraft(String(id));
    removeConflict(String(id));
    remoteSnapshots.current.delete(String(id));

    if (activeTab && fileId(activeTab) === String(id)) {
      const neighbour = result[Math.min(closedIndex, result.length - 1)];
      setActiveTab(neighbour ?? null);
    }
  };

  if (!activeTab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-zinc-600">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Circle size={22} className="text-zinc-700" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-zinc-400">No File Open</span>
          <span className="text-xs text-zinc-600">
            Select a file from Explorer to start editing
          </span>
        </div>
      </div>
    );
  }

  const ActiveIcon = getFileIcon(activeTab.name).icon;
  const activeColor = getFileIcon(activeTab.name).color;

  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0c]">
      <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/[0.06] bg-[#111113]/90">
        <AnimatePresence initial={false}>
          {openTabs.map((tab) => {
            const active = fileId(activeTab) === fileId(tab);
            const { icon: Icon, color } = getFileIcon(tab?.name);
            const tabConflict = conflicts[fileId(tab)];
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
                {tabConflict && (
                  <AlertTriangle
                    size={13}
                    className="text-amber-400"
                    title="Remote conflict"
                  />
                )}
                <button
                  aria-label={`Close ${tab?.name}`}
                  className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  onClick={(event) => handleCloseTab(event, tab?._id)}
                >
                  <X size={13} />
                </button>

                {active && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-sky-400 to-violet-400"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <ActiveIcon size={14} className={`${activeColor}`} />
          <span className="text-[13px]">{activeTab.name}</span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => void save()}
          disabled={saving || activeConflict?.kind === "deleted"}
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

      {(saveError || activeConflict) && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"
        >
          <span className="min-w-0 flex-1">
            {saveError ||
              (activeConflict?.kind === "deleted"
                ? "This file was deleted remotely. Your local changes are preserved."
                : "This file changed remotely. Your local changes are preserved.")}
          </span>
          {activeConflict?.kind === "changed" && (
            <>
              <button
                type="button"
                onClick={keepLocalConflict}
                className="rounded-md bg-amber-400/20 px-2 py-1 font-medium text-amber-100 hover:bg-amber-400/30"
              >
                Keep mine
              </button>
              <button
                type="button"
                onClick={discardRemoteConflict}
                className="rounded-md px-2 py-1 text-amber-100 underline underline-offset-2 hover:text-white"
              >
                Use remote
              </button>
            </>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          theme="vs-dark"
          path={String(activeTab._id)}
          language={activeTab.language || "plaintext"}
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
