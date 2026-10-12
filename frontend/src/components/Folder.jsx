import {
  ChevronRight,
  FilePlus2,
  FolderClosed,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getFileIcon, getFolderColor } from "../utils/customizeIcon";
import {
  createFile,
  createFolder,
  deleteFile,
  updateFile,
} from "../features/file";
import { getErrorMessage } from "../utils/errors";

const nodeIds = (node) => [
  String(node._id),
  ...(node.children ?? []).flatMap((child) => nodeIds(child)),
];

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

// Small text input used for "new file", "new folder" and "rename".
// Enter submits, Escape or clicking away cancels. Failed async mutations keep
// the input open so the user can correct or retry the request.
function InlineInput({ placeholder, initialValue = "", onSubmit, onClose }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event?.preventDefault();
    const nextValue = value.trim();
    if (!nextValue) {
      setError("Name cannot be empty.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(nextValue);
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update this item."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-1 pl-1">
      <motion.input
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        autoFocus
        value={value}
        placeholder={placeholder}
        disabled={submitting}
        className="w-full rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15 disabled:opacity-60"
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
        onBlur={() => {
          if (!submitting) onClose();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            void submit(event);
          }
          if (event.key === "Escape" && !submitting) {
            onClose();
          }
        }}
      />
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
      onClick={onClick}
    >
      <Icon size={13} />
      {children}
    </button>
  );
}

// The floating panel. Measures itself after layout and clamps to the
// viewport so it never renders off-screen; Escape closes it.
function MenuPanel({ x, y, onClose, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    const margin = 8;

    setPos({
      left: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
      top: Math.max(margin, Math.min(y, window.innerHeight - height - margin)),
    });
  }, [x, y]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={ref}
        role="menu"
        initial={{ opacity: 0, scale: 0.96, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -6 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="fixed z-50 w-52 rounded-xl border border-white/[0.08] bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
        style={{ left: pos.left, top: pos.top }}
      >
        {children}
      </motion.div>
    </>
  );
}

// `menu` is `{ x, y }` or null. AnimatePresence lets the exit animation run.
function ContextMenu({ menu, onClose, children }) {
  return createPortal(
    <AnimatePresence>
      {menu && (
        <MenuPanel key="menu" x={menu.x} y={menu.y} onClose={onClose}>
          {children}
        </MenuPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DeleteConfirm({
  label,
  warning,
  loading,
  error,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="mt-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-2">
      <p className="text-[11px] leading-relaxed text-red-200">
        Delete {label}? {warning}
      </p>
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-md bg-red-500/20 px-2 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/30 disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[11px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* File row                                                            */
/* ------------------------------------------------------------------ */

function FileNode({
  node,
  reloadTree,
  openFile,
  dirtyFileIds,
  onDeleted,
}) {
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const { icon: Icon, color } = getFileIcon(node.name);
  const isDirty = dirtyFileIds.includes(String(node._id));

  const closeMenu = () => setMenu(null);

  const handleRenameFile = async (newName) => {
    await updateFile({
      name: newName,
      id: node?._id,
      expectedUpdatedAt: node?.updatedAt,
    });
    await reloadTree();
  };

  const handleDeleteFile = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteFile(node?._id);
      onDeleted?.([String(node._id)]);
      setConfirmDelete(false);
      await reloadTree();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to delete this file."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
        onClick={() => openFile(node)}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5">
          <Icon size={13} className={`${color}`} />

          <span className="truncate text-[13px] text-zinc-300 transition-colors group-hover:text-white">
            {node?.name}
          </span>
        </div>
      </motion.div>

      <ContextMenu menu={menu} onClose={closeMenu}>
        <MenuItem
          icon={Pencil}
          onClick={() => {
            closeMenu();
            setActionError(null);
            setRenaming(true);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          icon={Trash}
          onClick={() => {
            closeMenu();
            setActionError(null);
            setConfirmDelete(true);
          }}
        >
          Delete
        </MenuItem>
      </ContextMenu>

      {renaming && (
        <InlineInput
          initialValue={node?.name}
          placeholder={node?.name}
          onSubmit={handleRenameFile}
          onClose={() => setRenaming(false)}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm
          label={`“${node?.name}”`}
          warning={
            isDirty
              ? "Your unsaved changes will be discarded."
              : "This cannot be undone."
          }
          loading={actionLoading}
          error={actionError}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void handleDeleteFile()}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Folder row                                                          */
/* ------------------------------------------------------------------ */

function FolderNode({
  projectId,
  reloadTree,
  node,
  openFile,
  dirtyFileIds,
  onDeleted,
}) {
  const [open, setOpen] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const folderColor = getFolderColor(node?.name);
  const ids = nodeIds(node);
  const hasDirtyDescendant = ids.some((id) => dirtyFileIds.includes(id));

  const closeMenu = () => setMenu(null);

  const handleCreateFolder = async (name) => {
    await createFolder({ projectId, name, parentId: node?._id });
    await reloadTree();
  };

  const handleCreateFile = async (name) => {
    const lang = name.includes(".") ? name.split(".").pop() : "plaintext";
    await createFile({
      projectId,
      name,
      parentId: node?._id,
      language: lang,
    });
    await reloadTree();
  };

  const handleRenameFolder = async (newName) => {
    await updateFile({
      name: newName,
      id: node?._id,
      expectedUpdatedAt: node?.updatedAt,
    });
    await reloadTree();
  };

  const handleDeleteFolder = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteFile(node?._id);
      onDeleted?.(ids);
      setConfirmDelete(false);
      await reloadTree();
    } catch (requestError) {
      setActionError(
        getErrorMessage(requestError, "Unable to delete this folder."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Both entry points (hover buttons and context menu) expand the folder so
  // the new input is visible.
  const startNewFolder = () => {
    setCreatingFolder(true);
    setCreatingFile(false);
    setOpen(true);
  };

  const startNewFile = () => {
    setCreatingFile(true);
    setCreatingFolder(false);
    setOpen(true);
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
        onContextMenu={(event) => {
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5"
          onClick={() => setOpen(!open)}
        >
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="shrink-0"
          >
            <ChevronRight size={14} className="text-zinc-500" />
          </motion.div>

          {open ? (
            <FolderOpen size={16} className={`shrink-0 ${folderColor}`} />
          ) : (
            <FolderClosed size={16} className={`shrink-0 ${folderColor}`} />
          )}

          <span className="truncate text-[13px] text-zinc-300 transition-colors group-hover:text-white">
            {node?.name}
          </span>
        </div>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <motion.button
            type="button"
            aria-label="New file"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              startNewFile();
            }}
          >
            <FilePlus2 size={13} />
          </motion.button>

          <motion.button
            type="button"
            aria-label="New folder"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              startNewFolder();
            }}
          >
            <FolderPlus size={13} />
          </motion.button>
        </div>
      </motion.div>

      <ContextMenu menu={menu} onClose={closeMenu}>
        <MenuItem
          icon={FilePlus2}
          onClick={() => {
            closeMenu();
            startNewFile();
          }}
        >
          New File
        </MenuItem>
        <MenuItem
          icon={FolderPlus}
          onClick={() => {
            closeMenu();
            startNewFolder();
          }}
        >
          New Folder
        </MenuItem>
        <div className="my-1 h-px bg-white/[0.08]" />
        <MenuItem
          icon={Pencil}
          onClick={() => {
            closeMenu();
            setActionError(null);
            setRenaming(true);
          }}
        >
          Rename
        </MenuItem>

        {node.parentId != null && (
          <MenuItem
            icon={Trash}
            onClick={() => {
              closeMenu();
              setActionError(null);
              setConfirmDelete(true);
            }}
          >
            Delete
          </MenuItem>
        )}
      </ContextMenu>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="ml-5 overflow-hidden border-l border-white/[0.05] pl-1"
          >
            {(node.children ?? []).map((child) => (
              <Folder
                key={child._id}
                projectId={projectId}
                openFile={openFile}
                reloadTree={reloadTree}
                node={child}
                dirtyFileIds={dirtyFileIds}
                onDeleted={onDeleted}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {creatingFolder && (
        <InlineInput
          placeholder="Folder Name"
          onSubmit={handleCreateFolder}
          onClose={() => setCreatingFolder(false)}
        />
      )}

      {creatingFile && (
        <InlineInput
          placeholder="File Name"
          onSubmit={handleCreateFile}
          onClose={() => setCreatingFile(false)}
        />
      )}

      {renaming && (
        <InlineInput
          initialValue={node?.name}
          placeholder={node?.name}
          onSubmit={handleRenameFolder}
          onClose={() => setRenaming(false)}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm
          label={`folder “${node?.name}”`}
          warning={
            hasDirtyDescendant
              ? "Unsaved changes inside it will be discarded."
              : "All files and folders inside it will be deleted."
          }
          loading={actionLoading}
          error={actionError}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void handleDeleteFolder()}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

function Folder({
  projectId,
  reloadTree,
  node,
  openFile,
  dirtyFileIds = [],
  onDeleted,
}) {
  if (node.type === "file") {
    return (
      <FileNode
        node={node}
        reloadTree={reloadTree}
        openFile={openFile}
        dirtyFileIds={dirtyFileIds}
        onDeleted={onDeleted}
      />
    );
  }

  return (
    <FolderNode
      projectId={projectId}
      node={node}
      reloadTree={reloadTree}
      openFile={openFile}
      dirtyFileIds={dirtyFileIds}
      onDeleted={onDeleted}
    />
  );
}

export default Folder;
