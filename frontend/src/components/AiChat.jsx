import {
  Bot,
  FileMinus,
  FilePen,
  FilePlus2,
  FolderPlus,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const TOOL_META = {
  folder_created: {
    icon: FolderPlus,
    color: "text-sky-400",
    label: "Created folder",
  },
  file_created: {
    icon: FilePlus2,
    color: "text-emerald-400",
    label: "Created file",
  },
  file_updated: {
    icon: FilePen,
    color: "text-amber-400",
    label: "Updated file",
  },
  file_deleted: {
    icon: FileMinus,
    color: "text-red-400",
    label: "File deleted",
  },
};

// How to read the "detail" (file/folder name) out of each tool event.
const TOOL_DETAIL = {
  file_created: (data) => data.file?.name,
  file_updated: (data) => data.file?.name,
  file_deleted: (data) => data.file?.name,
  folder_created: (data) => data.folder?.name,
};

const MAX_HISTORY = 20;

const ToolBadge = ({ toolType, detail }) => {
  const meta = TOOL_META[toolType];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11.5px] text-zinc-400">
        <Icon size={14} className={`${meta.color}`} />
        <span>{meta.label}</span>
        {detail && <span className="text-zinc-600">&middot; {detail}</span>}
      </div>
    </motion.div>
  );
};

function AiChat({ projectId, reloadTree }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const needsReload = useRef(false);
  const endRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handles one parsed server event. Throws on `error` events so the caller's
  // try/catch can show the problem to the user.
  const onEvent = (eventType, data) => {
    if (eventType in TOOL_DETAIL) {
      // Reload the file tree once when the stream ends, not on every event.
      needsReload.current = true;
      setMessages((prev) => [
        ...prev,
        {
          role: "tool",
          toolType: eventType,
          detail: TOOL_DETAIL[eventType](data),
        },
      ]);
      return;
    }

    if (eventType === "message") {
      const content = data?.content;
      if (!content) return;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && !last.error) {
          copy[copy.length - 1] = { ...last, content };
        } else {
          copy.push({ role: "assistant", content });
        }
        return copy;
      });
      return;
    }

    if (eventType === "error") {
      throw new Error(data?.message || "AI Error");
    }
  };

  // Parses a single SSE event block ("event: x\ndata: {...}") exactly once.
  const processEvent = (eventText) => {
    let eventType = "message";
    const dataLines = [];

    for (const line of eventText.split("\n")) {
      if (line.startsWith(":")) continue; // SSE comment / keep-alive
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }

    if (dataLines.length === 0) return;

    const dataText = dataLines.join("\n");
    let data;
    try {
      data = JSON.parse(dataText);
    } catch {
      data = { content: dataText };
    }

    onEvent(eventType, data);
  };

  const handleChat = async () => {
    const text = message.trim();
    if (!text || loading) return; // nothing to send, or a request is running

    // Clean history: only real user/assistant text, no tool badges or errors.
    // Built before the new message is added so it isn't sent twice.
    const history = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          !m.error &&
          m.content,
      )
      .map(({ role, content }) => ({ role, content }))
      .slice(-MAX_HISTORY);

    setLoading(true);
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          credentials: "include",
          body: JSON.stringify({ projectId, message: text, history }),
        },
      );

      if (!response.ok) {
        let errorMessage = "AI Request Failed";
        try {
          const data = await response.json();
          errorMessage = data?.message || errorMessage;
        } catch {
          // keep the default message
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("AI streaming is not supported.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, "\n");

          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventText of events) {
            if (!eventText.trim()) continue;
            processEvent(eventText);
          }
        }

        // The stream may end without a trailing blank line.
        if (buffer.trim()) processEvent(buffer);
      } catch (streamError) {
        await reader.cancel().catch(() => {});
        throw streamError;
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error.message || "AI request failed",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      if (needsReload.current) {
        needsReload.current = false;
        reloadTree?.();
      }
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter inserts a newline. `isComposing` avoids sending
    // while an IME (Japanese/Chinese/Korean input) is confirming a character.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleChat();
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-col border-l border-white/[0.06] bg-[#111113]/90 backdrop-blur-xl md:w-80">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <Sparkles size={14} className="text-sky-400" />
        <span className="text-[13px] font-medium text-zinc-300">
          Dev-Verse AI Chat
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="mt-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] ">
              <Sparkles size={22} className="text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">
              What do you want to Build?
            </p>
            <p className="mt-1.5 text-xs text-zinc-600">
              Ask me to create or modify files.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === "tool") {
              return (
                <ToolBadge
                  key={i}
                  toolType={msg.toolType}
                  detail={msg.detail}
                />
              );
            }
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-white/10 text-zinc-300" : "bg-gradient-to-br from-sky-400 to-violet-400 text-white"}`}
                >
                  {isUser ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${isUser ? "bg-gradient-to-b from-sky-500 to-sky-600 text-white" : msg.error ? "border border-red-500/20 bg-red-500/10 text-red-300" : "border border-white/[0.06] bg-white/[0.03] text-zinc-300"}`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 pl-8 text-xs text-zinc-500">
            <Loader2 size={13} className="animate-spin" />
            <span>AI Is Working...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-end gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 transition-colors focus-within:border-sky-400/40">
          <textarea
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            value={message}
            placeholder="Ask AI to build something..."
            aria-label="Message to AI"
            rows={2}
            className="flex-1 resize-none bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          <motion.button
            type="button"
            onClick={handleChat}
            aria-label="Send message"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading || !message.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-opacity hover:from-sky-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default AiChat;