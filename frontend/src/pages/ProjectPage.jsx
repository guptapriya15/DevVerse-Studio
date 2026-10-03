import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import ActivityBar from "../components/ActivityBar";
import Explorer from "../components/Explorer";
import TopBar from "../components/TopBar";
import { getTree } from "../features/file";
import { getProjectById } from "../features/project";
import { setCurrentProject } from "../redux/projectSlice";
import {
  Bot,
  Code2,
  Eye,
  Files,
  Maximize2,
  Minimize2,
  TerminalSquare,
  X,
} from "lucide-react";
import Preview from "../components/Preview";
import Editor from "../components/Editor";
import BottomPanel from "../components/BottomPanel";
import AiChat from "../components/AiChat";
import { getErrorMessage } from "../utils/errors";

// Find a node (by id) anywhere in the tree.
const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node._id == id) return node;
    if (node.children?.length) {
      const hit = findNode(node.children, id);
      if (hit) return hit;
    }
  }
  return null;
};

// Immutably patch one node (by id) anywhere in the tree.
const patchNode = (nodes, id, patch) =>
  nodes.map((node) => {
    if (node._id == id) return { ...node, ...patch };
    if (node.children?.length) {
      return { ...node, children: patchNode(node.children, id, patch) };
    }
    return node;
  });

function ProjectPage() {
  const { id } = useParams();
  const [showExplorer, setShowExplorer] = useState(true);
  const [showAiChat, setShowAiChat] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [tree, setTree] = useState([]);
  const [mobilePane, setMobilePane] = useState("explorer");
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [pageError, setPageError] = useState(null);
  const dispatch = useDispatch();

  const reloadTree = useCallback(async () => {
    try {
      const data = await getTree(id);
      setTree(Array.isArray(data) ? data : []);
      setPageError(null);
    } catch (error) {
      setTree([]);
      setPageError(getErrorMessage(error, "Unable to load project."));
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadProjectPage = async () => {
      // allSettled: the file tree still loads if the project fetch fails.
      const [projectResult, treeResult] = await Promise.allSettled([
        getProjectById(id),
        getTree(id),
      ]);

      if (!active) return;

      if (projectResult.status === "fulfilled" && projectResult.value) {
        dispatch(setCurrentProject(projectResult.value));
      }

      if (treeResult.status === "fulfilled") {
        setTree(Array.isArray(treeResult.value) ? treeResult.value : []);
        setPageError(
          projectResult.status === "rejected"
            ? getErrorMessage(projectResult.reason, "Unable to load project.")
            : null,
        );
      } else {
        setTree([]);
        setPageError(
          getErrorMessage(treeResult.reason, "Unable to load project."),
        );
      }
    };

    void loadProjectPage();

    return () => {
      active = false;
    };
  }, [id, dispatch]);

  // Keep open tabs in step with the tree. Without this, after the AI (or a
  // rename/delete) changes files and the tree reloads, tabs keep their old
  // copy, and pressing Save would overwrite the new content with the old.
  useEffect(() => {
    // An empty tree usually means a failed/in-progress load, not "everything
    // was deleted", so don't close the user's tabs because of it.
    if (tree.length === 0) return;

    // Returns the same object when nothing changed (so React can skip
    // re-rendering), a refreshed copy when it did, or null if the file is gone.
    const syncTab = (tab) => {
      const node = findNode(tree, tab._id);
      if (!node) return null;
      if (
        node.name === tab.name &&
        node.language === tab.language &&
        node.content === tab.content
      ) {
        return tab;
      }
      return {
        ...tab,
        name: node.name,
        language: node.language,
        content: node.content,
      };
    };

    setOpenTabs((tabs) => {
      const next = tabs.map(syncTab).filter(Boolean);
      const unchanged =
        next.length === tabs.length && next.every((tab, i) => tab === tabs[i]);
      return unchanged ? tabs : next;
    });
    setActiveTab((current) => (current ? syncTab(current) : current));
  }, [tree]);

  const openFile = (file) => {
    // The tree copy can be older than the tab copy, so prefer the open tab.
    const existing = openTabs.find((tab) => tab._id == file._id);
    if (!existing) setOpenTabs((prev) => [...prev, file]);
    setActiveTab(existing ?? file);
    setShowPreview(false);
  };

  // Called by Editor after a successful save so Preview / Explorer / rename
  // all see the saved content instead of the stale copy loaded at page start.
  const handleFileSaved = useCallback((file) => {
    setTree((prev) => patchNode(prev, file._id, { content: file.content }));
  }, []);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0c]">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />
      <TopBar />

      {pageError && (
        <div
          role="alert"
          className="relative z-10 flex items-center justify-between gap-3 border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-300"
        >
          <span className="min-w-0 truncate">{pageError}</span>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={reloadTree}
              className="font-medium underline underline-offset-2"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setPageError(null)}
              aria-label="Dismiss error"
              className="rounded p-0.5 hover:bg-white/10"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <ActivityBar
            showAiChat={showAiChat}
            showExplorer={showExplorer}
            showTerminal={showBottomPanel}
            setShowAiChat={setShowAiChat}
            setShowExplorer={setShowExplorer}
            setShowTerminal={setShowBottomPanel}
          />
        </div>

        <div
          className={`${mobilePane === "explorer" ? "flex" : "hidden"} w-full md:flex md:w-auto`}
        >
          <AnimatePresence initial={false}>
            {showExplorer && (
              <Explorer
                projectId={id}
                tree={tree}
                openFile={openFile}
                error={pageError}
                reloadTree={reloadTree}
              />
            )}
          </AnimatePresence>
        </div>

        <div
          className={`${mobilePane === "editor" ? "flex" : "hidden"} relative w-full min-w-0 flex-col overflow-hidden border-x border-white/[0.05] md:flex`}
        >
          <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center gap-1.5 sm:right-4 sm:top-3 sm:gap-2">
            {showPreview && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setIsPreviewFullScreen((v) => !v)}
                title={
                  isPreviewFullScreen ? "Exit fullscreen" : "Fullscreen preview"
                }
                className="pointer-events-auto flex items-center justify-center rounded-lg border border-white/10 bg-[#111113]/95 p-1.5 text-zinc-400 shadow-lg shadow-black/40 backdrop-blur hover:text-white sm:p-2"
              >
                {isPreviewFullScreen ? (
                  <Minimize2 size={13} />
                ) : (
                  <Maximize2 size={13} />
                )}
              </motion.button>
            )}

            <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#111113]/95 p-1 shadow-lg shadow-black/40 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  setIsPreviewFullScreen(false);
                }}
                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:py-1.5 sm:text-xs ${
                  !showPreview
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {!showPreview && (
                  <motion.div
                    layoutId="viewTab"
                    className="absolute inset-0 rounded-md bg-gradient-to-b from-zinc-700 to-zinc-800"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <Code2 size={13} className="relative" />
                <span className="relative hidden sm:inline">Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:py-1.5 sm:text-xs ${
                  showPreview
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {showPreview && (
                  <motion.div
                    layoutId="viewTab"
                    className="absolute inset-0 rounded-md bg-gradient-to-b from-zinc-700 to-zinc-800"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <Eye size={13} className="relative" />
                <span className="relative hidden sm:inline">Preview</span>
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {showPreview && <Preview tree={tree} />}
            {/* Stay mounted (just hidden) so unsaved drafts survive a trip to Preview. */}
            <div
              className={
                showPreview ? "hidden" : "flex min-h-0 min-w-0 flex-1"
              }
            >
              <Editor
                activeTab={activeTab}
                openTabs={openTabs}
                setOpenTabs={setOpenTabs}
                setActiveTab={setActiveTab}
                onSaved={handleFileSaved}
              />
            </div>
          </div>

          <AnimatePresence>
            {showPreview && isPreviewFullScreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-0 z-[100] bg-white"
              >
                <Preview tree={tree} />
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setIsPreviewFullScreen(false)}
                  title="Exit fullscreen"
                  className="absolute right-2 top-2 z-[110] flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111113]/95 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg shadow-black/40 backdrop-blur hover:text-white sm:right-4 sm:top-3 sm:px-3 sm:text-xs"
                >
                  <Minimize2 size={13} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showBottomPanel && (
              <BottomPanel
                key="bottom-panel"
                projectId={id}
                onClose={() => setShowBottomPanel(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <div
          className={`${mobilePane === "chat" ? "flex" : "hidden"} w-full md:flex md:w-auto`}
        >
          <AnimatePresence initial={false}>
            {showAiChat && <AiChat projectId={id} reloadTree={reloadTree} />}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-around border-t border-white/[0.06] bg-[#0f0f12] py-2 md:hidden">
        <button
          type="button"
          onClick={() => {
            setMobilePane("explorer");
            setShowExplorer(true);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${mobilePane === "explorer" ? "text-white" : "text-zinc-500"}`}
        >
          <Files size={18} />
          Files
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane("editor");
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${mobilePane === "editor" ? "text-white" : "text-zinc-500"}`}
        >
          <Code2 size={18} />
          Editor
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane("chat");
            setShowAiChat(true);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${mobilePane === "chat" ? "text-white" : "text-zinc-500"}`}
        >
          <Bot size={18} />
          AI Chat
        </button>

        <button
          type="button"
          onClick={() => {
            setShowBottomPanel((v) => !v);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${showBottomPanel ? "text-white" : "text-zinc-500"}`}
        >
          <TerminalSquare size={18} />
          Terminal
        </button>
      </div>
    </div>
  );
}

export default ProjectPage;