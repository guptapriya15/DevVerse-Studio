import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import ActivityBar from "../components/ActivityBar";
import Explorer from "../components/Explorer";
import TopBar from "../components/TopBar";
import { getTree } from "../features/file";
import { getProjectById } from "../features/project";
import { setCurrentProject } from "../redux/projectSlice";

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Unable to load project.";
}

function ProjectPage() {
  const { id } = useParams();
  const [showExplorer, setShowExplorer] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tree, setTree] = useState([]);
  const [pageError, setPageError] = useState(null);
  const dispatch = useDispatch();

  const reloadTree = useCallback(async () => {
    try {
      const data = await getTree(id);
      setTree(Array.isArray(data) ? data : []);
      setPageError(null);
    } catch (error) {
      setTree([]);
      setPageError(getErrorMessage(error));
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadProjectPage = async () => {
      try {
        const [project, fileTree] = await Promise.all([
          getProjectById(id),
          getTree(id),
        ]);

        if (!active) return;

        if (project) {
          dispatch(setCurrentProject(project));
        }
        setTree(Array.isArray(fileTree) ? fileTree : []);
        setPageError(null);
      } catch (error) {
        if (!active) return;

        setTree([]);
        setPageError(getErrorMessage(error));
      }
    };

    void loadProjectPage();

    return () => {
      active = false;
    };
  }, [id, dispatch]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0c]">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />
      <TopBar showPreview={showPreview} setShowPreview={setShowPreview} />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          showAiChat={showAiChat}
          showExplorer={showExplorer}
          showTerminal={showTerminal}
          setShowAiChat={setShowAiChat}
          setShowExplorer={setShowExplorer}
          setShowTerminal={setShowTerminal}
        />
        <AnimatePresence initial={false}>
          {showExplorer && (
            <Explorer
              projectId={id}
              tree={tree}
              error={pageError}
              reloadTree={reloadTree}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProjectPage;
