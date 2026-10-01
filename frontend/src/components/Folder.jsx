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

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

// Small text input used for "new file", "new folder" and "rename".
// Enter submits, Escape or clicking away cancels.
function InlineInput({ placeholder, onSubmit, onClose }) {
  const [value, setValue] = useState("");

  return (
    <div className="py-1 pl-1">
      <motion.input
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        autoFocus
        value={value}
        placeholder={placeholder}
        className="w-full rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
        onChange={(e) => setValue(e.target.value)}
        onBlur={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit(value);
            onClose();
          }
          if (e.key === "Escape") {
            onClose();
          }
        }}
      />
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

/* ------------------------------------------------------------------ */
/* File row                                                            */
/* ------------------------------------------------------------------ */

function FileNode({ node, reloadTree, openFile }) {
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const { icon: Icon, color } = getFileIcon(node.name);

  const closeMenu = () => setMenu(null);

  const handleRenameFile = async (newName) => {
    await updateFile({
      name: newName,
      id: node?._id,
      content: node?.content,
    });
    await reloadTree();
  };

  const handleDeleteFile = async () => {
    await deleteFile(node?._id);
    await reloadTree();
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        onClick={() => openFile(node)}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
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
            setRenaming(true);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          icon={Trash}
          onClick={() => {
            handleDeleteFile();
            closeMenu();
          }}
        >
          Delete
        </MenuItem>
      </ContextMenu>

      {renaming && (
        <InlineInput
          placeholder={node?.name}
          onSubmit={handleRenameFile}
          onClose={() => setRenaming(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Folder row                                                          */
/* ------------------------------------------------------------------ */

function FolderNode({ projectId, reloadTree, node, openFile }) {
  const [open, setOpen] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const folderColor = getFolderColor(node?.name);

  const closeMenu = () => setMenu(null);

  const handleCreateFolder = async (name) => {
    await createFolder({ projectId, name, parentId: node?._id });
    await reloadTree();
  };

  const handleCreateFile = async (name) => {
    const lang = name.split(".").pop();
    await createFile({
      projectId,
      name,
      parentId: node?._id,
      language: lang,
    });
    await reloadTree();
  };

  const handleRenameFile = async (newName) => {
    await updateFile({
      name: newName,
      id: node?._id,
      content: node?.content,
    });
    await reloadTree();
  };

  const handleDeleteFile = async () => {
    await deleteFile(node?._id);
    await reloadTree();
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
        className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
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
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
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
            setRenaming(true);
          }}
        >
          Rename
        </MenuItem>

        {node.parentId != null && (
          <MenuItem
            icon={Trash}
            onClick={() => {
              handleDeleteFile();
              closeMenu();
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
            {node.children.map((child) => (
              <Folder
                projectId={projectId}
                openFile={openFile}
                reloadTree={reloadTree}
                node={child}
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
          placeholder={node?.name}
          onSubmit={handleRenameFile}
          onClose={() => setRenaming(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

function Folder({ projectId, reloadTree, node, openFile }) {
  if (node.type == "file") {
    return <FileNode node={node} reloadTree={reloadTree} openFile={openFile} />;
  }

  return (
    <FolderNode
      projectId={projectId}
      node={node}
      reloadTree={reloadTree}
      openFile={openFile}
    />
  );
}

export default Folder;