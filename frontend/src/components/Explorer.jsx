import { FileCode2, Folder, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

function TreeNode({ node, depth = 0 }) {
  const isFolder = node.type === "folder";
  const Icon = isFolder ? Folder : FileCode2;
  const children = Array.isArray(node.children) ? node.children : [];

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 text-xs text-zinc-300"
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <Icon size={14} className="shrink-0 text-zinc-500" />
        <span className="truncate">{node.name}</span>
      </div>
      {children.map((child) => (
        <TreeNode key={child._id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function Explorer({ projectId, tree = [], error, reloadTree }) {
  const nodes = Array.isArray(tree) ? tree : [];

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16, width: 0 }}
      animate={{ opacity: 1, x: 0, width: 288 }}
      exit={{ opacity: 0, x: -16, width: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col overflow-hidden border-r border-white/[0.06] bg-[#111113]/90 backdrop-blur-xl"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
            Explorer
          </p>
          <p className="truncate text-[10px] text-zinc-600">{projectId}</p>
        </div>
        <button
          type="button"
          onClick={reloadTree}
          aria-label="Refresh files"
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      {error && (
        <p className="border-b border-red-400/10 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {nodes.length > 0 ? (
          nodes.map((node) => <TreeNode key={node._id} node={node} />)
        ) : (
          <p className="px-3 py-4 text-xs text-zinc-500">No files yet.</p>
        )}
      </div>
    </motion.aside>
  );
}

export default Explorer;
