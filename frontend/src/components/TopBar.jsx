import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

// The Editor/Preview toggle lives in ProjectPage's floating pill, so the
// TopBar no longer duplicates it.
function TopBar() {
  const { id } = useParams();
  const { currentProject } = useSelector((state) => state.project);

  // Don't show the previous project's name while the new one is loading.
  const projectReady = currentProject?._id === id;

  return (
    <div className="relative flex h-12 items-center border-b border-white/[0.06] bg-[#111113]/90 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden text-lg font-bold text-white sm:block">
          Dev-Verse Studio
        </div>
        <div className="hidden h-4 w-px bg-white/10 sm:block" />
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[13px]">
            📁
          </div>
          {projectReady ? (
            <div className="max-w-[220px] truncate text-sm font-medium text-zinc-300">
              {currentProject?.name || "project"}
            </div>
          ) : (
            <div
              className="h-4 w-28 animate-pulse rounded bg-white/10"
              aria-label="Loading project name"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar;