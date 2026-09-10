import { Star, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { deleteProject, toggleStar } from "../features/project";

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Unable to update the project.";

function ProjectCard({ project, onChanged }) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  if (!project) return null;

  const handleToggleStar = async (event) => {
    event.stopPropagation();
    setLoadingAction(true);
    setError(null);

    try {
      await toggleStar(project._id);
      onChanged?.();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    setLoadingAction(true);
    setError(null);

    try {
      await deleteProject(project._id);
      onChanged?.();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group relative rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:border-white/[0.07] dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/[0.14] dark:hover:bg-white/[0.045]"
    >
      <div className="mb-8 min-w-0 pr-5">
        <h3 className="truncate text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-white">
          {project.name || "Untitled project"}
        </h3>
        <p className="line-clamp-2 min-h-[2.5em] text-[12.5px] leading-snug text-zinc-500 dark:text-zinc-400">
          {project.description || "No Description"}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          disabled={loadingAction}
          onClick={handleToggleStar}
          aria-label={project.starred ? "Unstar project" : "Star project"}
          className={`rounded-md p-1.5 transition-colors hover:bg-amber-50 dark:hover:bg-amber-400/10 ${project.starred ? "text-amber-400" : "text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"} ${loadingAction ? "cursor-wait opacity-60" : ""}`}
        >
          <Star size={15} className={project.starred ? "fill-amber-400" : ""} />
        </motion.button>
        {confirmDelete ? (
          <div className="ml-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={loadingAction}
              className="rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loadingAction}
              className="rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50 dark:text-red-400"
            >
              {loadingAction ? "..." : "Yes"}
            </button>
          </div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setConfirmDelete(true)}
            disabled={loadingAction}
            aria-label="Delete project"
            className="ml-1 rounded-md p-1.5 text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400"
          >
            <Trash2 size={13} />
          </motion.button>
        )}
      </div>
      {error && (
        <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </motion.div>
  );
}

export default ProjectCard;
