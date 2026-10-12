import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Code2,
  Command,
  Eye,
  Files,
  FolderKanban,
  Layers3,
  Menu,
  Moon,
  Play,
  Sparkles,
  Sun,
  TerminalSquare,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const showcaseSteps = [
  {
    id: "build",
    eyebrow: "01 / Build",
    title: "Turn a thought into a working surface.",
    description:
      "Describe the direction, let AI shape the first pass, then keep your hands on the code. Every project starts in one focused workspace.",
    icon: WandSparkles,
    accent: "from-violet-500 to-indigo-500",
    file: "src/components/Hero.jsx",
    lines: [
      ["import", " { motion }", " from ", "\"motion/react\";"],
      ["", ""],
      ["export", " default function Hero() {"],
      ["  return", " ("],
      ["    <section", " className=\"hero\">"],
      ["      <h1>", "Build the next idea", "</h1>"],
      ["    </section>", ";"],
      ["  );"],
      ["}"],
    ],
    status: "AI suggested 3 refinements",
  },
  {
    id: "preview",
    eyebrow: "02 / Preview",
    title: "See the change before you ship it.",
    description:
      "Switch from editor to live preview without losing your flow. Iterate on HTML, CSS, JavaScript, or React in the same project.",
    icon: Eye,
    accent: "from-sky-400 to-cyan-400",
    file: "src/pages/Preview.jsx",
    lines: [
      ["const", " previewModes", " = ["],
      ["  \"desktop\",", " \"tablet\",", " \"mobile\","],
      ["]"],
      [""],
      ["return", " ("],
      ["  <Preview", " mode={activeMode}"],
      ["    files={projectFiles}", " />"],
      [");"],
    ],
    status: "Preview synced just now",
  },
  {
    id: "collaborate",
    eyebrow: "03 / Refine",
    title: "Keep the whole build in view.",
    description:
      "Move between files, terminal output, and AI guidance without breaking context. The workspace stays close to the work.",
    icon: Bot,
    accent: "from-fuchsia-400 to-violet-500",
    file: "AI assistant",
    lines: [
      ["You", " Make the card feel more tactile"],
      [""],
      ["Dev-Verse AI", " I’ll add a soft lift, a"],
      ["", "subtle border glow, and keep the"],
      ["", "focus state accessible."],
      [""],
      ["Done", " Updated Card.jsx"],
    ],
    status: "Changes applied to 2 files",
  },
];

const featureCards = [
  {
    icon: Bot,
    label: "AI pair builder",
    title: "A faster first draft, without giving up the wheel.",
    description:
      "Ask for a component, a fix, or a direction. Keep the useful parts, edit the rest, and stay in control of every change.",
    className: "md:col-span-2",
    visual: "chat",
  },
  {
    icon: Code2,
    label: "Focused editor",
    title: "Your files, your shortcuts, your flow.",
    description:
      "Open files quickly, preserve drafts, and move from idea to implementation with an editor that stays out of the way.",
    visual: "editor",
  },
  {
    icon: Eye,
    label: "Instant preview",
    title: "Make the result tangible sooner.",
    description:
      "Preview the experience as you build it, then go straight back to the exact file that needs attention.",
    visual: "preview",
  },
  {
    icon: TerminalSquare,
    label: "Built-in terminal",
    title: "Keep the command line close.",
    description:
      "Run the checks and commands that make your project real, without leaving the workspace.",
    className: "md:col-span-2",
    visual: "terminal",
  },
];

const faqs = [
  {
    question: "What can I build in Dev-Verse Studio?",
    answer:
      "You can create and manage projects, edit HTML, CSS, JavaScript, and React files, preview your work, use AI-assisted coding, and run commands through the built-in terminal.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Dev-Verse Studio runs in the browser, so your projects and tools are available from one focused workspace without a local setup step.",
  },
  {
    question: "How do AI credits work?",
    answer:
      "AI actions use credits. Every account starts with a free allowance, and the Pro and Team plans add more monthly credits for larger, more frequent builds.",
  },
  {
    question: "Can I preview React projects?",
    answer:
      "Yes. The workspace supports React preview alongside HTML, CSS, and JavaScript workflows, so you can choose the right starting point for the project.",
  },
];

const codeTokenClass = (index) => {
  if (index === 0) return "text-fuchsia-300";
  if (index === 1) return "text-sky-300";
  if (index === 2) return "text-zinc-500";
  return "text-zinc-200";
};

function BrandMark({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/25">
        <Command size={16} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
          Dev-Verse <span className="text-indigo-500">Studio</span>
        </span>
      )}
    </span>
  );
}

function ProductPreview({ compact = false }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-2xl shadow-indigo-950/10 dark:border-white/[0.1] dark:bg-[#0d0d14]/95 dark:shadow-black/50 ${compact ? "h-full" : ""}`}>
      <div className="flex h-10 items-center justify-between border-b border-slate-200/80 px-3.5 dark:border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400 dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          workspace / new-project
        </div>
        <div className="h-5 w-5 rounded-md bg-slate-100 dark:bg-white/[0.06]" />
      </div>

      <div className="grid min-h-[300px] grid-cols-[112px_1fr] sm:grid-cols-[150px_1fr]">
        <div className="border-r border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/[0.07] dark:bg-white/[0.018]">
          <div className="mb-4 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
            <Files size={11} /> Explorer
          </div>
          <div className="space-y-2 text-[10px] text-slate-500 dark:text-zinc-500">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
              <span className="text-indigo-500">⌄</span> src
            </div>
            <div className="ml-3 flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-1.5 py-1 text-indigo-600 dark:text-indigo-300">
              <Code2 size={10} /> App.jsx
            </div>
            <div className="ml-3 flex items-center gap-1.5 px-1.5">
              <Code2 size={10} /> styles.css
            </div>
            <div className="ml-3 flex items-center gap-1.5 px-1.5">
              <Code2 size={10} /> Preview.jsx
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
              <span className="text-indigo-500">⌄</span> public
            </div>
            <div className="ml-3 flex items-center gap-1.5 px-1.5">
              <span className="text-amber-500">◇</span> index.html
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex h-8 items-center border-b border-slate-200/80 px-3 dark:border-white/[0.07]">
            <div className="flex h-full items-center gap-1.5 border-b-2 border-indigo-500 px-2 text-[10px] font-medium text-slate-700 dark:text-zinc-200">
              <Code2 size={10} className="text-indigo-400" /> App.jsx <span className="text-slate-400">×</span>
            </div>
          </div>
          <div className="grid grid-cols-[24px_1fr] gap-2 p-4 font-mono text-[9px] leading-[1.9] sm:text-[10px]">
            <div className="select-none text-right text-slate-300 dark:text-zinc-700">{[1, 2, 3, 4, 5, 6, 7, 8].map((line) => <div key={line}>{line}</div>)}</div>
            <div className="overflow-hidden whitespace-nowrap">
              <div><span className="text-fuchsia-500 dark:text-fuchsia-300">import</span> <span className="text-sky-600 dark:text-sky-300">{`{ Sparkles }`}</span> <span className="text-slate-400">from</span> <span className="text-emerald-600 dark:text-emerald-300">&quot;lucide-react&quot;</span>;</div>
              <div>&nbsp;</div>
              <div><span className="text-fuchsia-500 dark:text-fuchsia-300">export default function</span> <span className="text-indigo-600 dark:text-indigo-300">App</span>() {`{`}</div>
              <div>&nbsp;&nbsp;<span className="text-fuchsia-500 dark:text-fuchsia-300">return</span> (</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-600 dark:text-sky-300">&lt;main</span> <span className="text-amber-600 dark:text-amber-200">className</span>=<span className="text-emerald-600 dark:text-emerald-300">&quot;space-y-8&quot;</span><span className="text-sky-600 dark:text-sky-300">&gt;</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-600 dark:text-sky-300">&lt;Hero</span> <span className="text-amber-600 dark:text-amber-200">animated</span> <span className="text-sky-600 dark:text-sky-300">/&gt;</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-600 dark:text-sky-300">&lt;/main&gt;</span></div>
              <div>&nbsp;&nbsp;);</div>
            </div>
          </div>
          <div className="mx-3 mb-3 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-2.5 text-[9px] text-slate-500 dark:text-zinc-400">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-300"><Sparkles size={10} /> Dev-Verse AI</div>
            <p>Try adding a soft entrance animation to the hero content.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-[9px] text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-zinc-500">
        <span className="flex items-center gap-1.5"><TerminalSquare size={10} /> Terminal ready</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Saved</span>
      </div>
    </div>
  );
}

function LandingPage() {
  const { userData } = useSelector((state) => state.user);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem("theme") !== "light";
    } catch {
      return true;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState("build");
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      window.localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // The theme still changes for the current session if storage is blocked.
    }
  }, [isDark]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeShowcase = showcaseSteps.find((step) => step.id === activeStep) ?? showcaseSteps[0];
  const ShowcaseIcon = activeShowcase.icon;
  const closeMenu = () => setMenuOpen(false);
  const dashboardLabel = userData ? "Open Studio" : "Start building";

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 transition-colors duration-300 dark:bg-[#07070c] dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-70 [background-image:linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-[-14rem] -z-10 h-[34rem] w-[48rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[130px] dark:bg-violet-600/15" />
      <div className="pointer-events-none absolute right-[-18rem] top-[42rem] -z-10 h-[36rem] w-[36rem] rounded-full bg-sky-400/10 blur-[140px] dark:bg-indigo-500/10" />

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#07070c]/75">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" aria-label="Dev-Verse Studio home" onClick={closeMenu}>
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-500 lg:flex dark:text-zinc-400" aria-label="Main navigation">
            <a className="transition-colors hover:text-slate-950 dark:hover:text-white" href="#product">Product</a>
            <a className="transition-colors hover:text-slate-950 dark:hover:text-white" href="#workflow">Workflow</a>
            <a className="transition-colors hover:text-slate-950 dark:hover:text-white" href="#features">Features</a>
            <a className="transition-colors hover:text-slate-950 dark:hover:text-white" href="#pricing">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <button
              type="button"
              onClick={() => setIsDark((previous) => !previous)}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/dashboard" className="rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white">Sign in</Link>
            <Link to="/dashboard" className="group flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:shadow-black/20 dark:hover:bg-indigo-100">
              {dashboardLabel}<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={() => setIsDark((previous) => !previous)}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70 dark:text-zinc-400 dark:hover:bg-white/[0.07]"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((previous) => !previous)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/70 dark:text-zinc-300 dark:hover:bg-white/[0.07]"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-200/70 bg-slate-50/95 px-5 py-4 lg:hidden dark:border-white/[0.07] dark:bg-[#0a0a10]/95">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-medium" aria-label="Mobile navigation">
              {["product", "workflow", "features", "pricing"].map((item) => (
                <a key={item} href={`#${item}`} onClick={closeMenu} className="rounded-lg px-3 py-2.5 capitalize text-slate-600 hover:bg-slate-200/70 dark:text-zinc-300 dark:hover:bg-white/[0.06]">{item}</a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3 dark:border-white/[0.07]">
                <Link to="/dashboard" onClick={closeMenu} className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-slate-700 dark:border-white/[0.1] dark:text-zinc-200">Sign in</Link>
                <Link to="/dashboard" onClick={closeMenu} className="rounded-lg bg-slate-950 px-3 py-2.5 text-center font-semibold text-white dark:bg-white dark:text-slate-950">{dashboardLabel}</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28 lg:px-10 lg:pt-32" aria-labelledby="hero-heading">
          <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.9)]" /> The browser-based AI IDE
              </div>
              <h1 id="hero-heading" className="max-w-2xl text-[clamp(2.8rem,7vw,5.7rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-slate-950 dark:text-white">
                Make ideas <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-transparent">shippable.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-500 sm:text-lg dark:text-zinc-400">
                Dev-Verse Studio brings AI, code, preview, and terminal into one calm workspace—so you can move from a rough thought to a real project with less friction.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/dashboard" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-950/15 transition hover:-translate-y-0.5 hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100">
                  {dashboardLabel}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#product" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-200 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.06]">
                  See how it works <Play size={14} fill="currentColor" />
                </a>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                <span className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Start with free AI credits</span>
                <span className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> No local setup</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.65, ease: "easeOut" }} className="relative">
              <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-sky-400/20 blur-3xl" />
              <div className="relative rotate-[1deg] rounded-[1.15rem] border border-slate-200/80 bg-slate-200/40 p-1 shadow-2xl shadow-indigo-950/10 dark:border-white/[0.12] dark:bg-white/[0.05] dark:shadow-black/50">
                <ProductPreview />
              </div>
              <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-[10px] font-semibold text-slate-700 shadow-xl shadow-slate-900/10 sm:flex dark:border-white/[0.1] dark:bg-[#14141c]/95 dark:text-zinc-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500"><Zap size={13} fill="currentColor" /></span>
                AI suggestions, in context
              </div>
              <div className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-[10px] font-semibold text-slate-700 shadow-xl shadow-slate-900/10 sm:flex dark:border-white/[0.1] dark:bg-[#14141c]/95 dark:text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> Live workspace
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white/35 dark:border-white/[0.06] dark:bg-white/[0.015]" aria-label="Product capabilities">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200/70 px-5 py-7 sm:grid-cols-4 sm:px-8 dark:divide-white/[0.06] lg:px-10">
            {[
              ["01", "AI-assisted", "coding"],
              ["02", "Live", "preview"],
              ["03", "Built-in", "terminal"],
              ["04", "One calm", "workspace"],
            ].map(([number, title, subtitle]) => (
              <div key={number} className="px-3 first:pl-0 sm:px-6 lg:px-8">
                <p className="text-[10px] font-bold tracking-[0.2em] text-indigo-500">{number}</p>
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-zinc-200">{title}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="product" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">A better starting point</p>
            <h2 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl dark:text-white">Build with momentum, not menu hunting.</h2>
            <p className="mt-5 text-base leading-7 text-slate-500 dark:text-zinc-400">The tools you need are already arranged around the work. Ask, edit, run, and see the result without constantly changing context.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 p-6 md:col-span-2 dark:border-white/[0.08] dark:bg-white/[0.025]">
              <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />
              <div className="relative flex min-h-[220px] flex-col justify-between">
                <div>
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><Sparkles size={19} /></div>
                  <h3 className="max-w-md text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">From blank canvas to a useful first pass.</h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-zinc-400">Describe what you’re making in plain language. Dev-Verse AI can help you shape components, explain code, and keep the next step close.</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-300"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10"><ArrowRight size={13} /></span> Prompt to progress</div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 p-6 dark:border-white/[0.08] dark:bg-white/[0.025]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500"><FolderKanban size={19} /></div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Projects that stay understandable.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-zinc-400">Keep ideas organized, files close, and your active build easy to return to.</p>
              <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 dark:text-zinc-300"><FolderKanban size={12} className="text-sky-500" /> portfolio-site</div>
                <div className="mt-2 h-1.5 w-4/5 rounded-full bg-slate-200 dark:bg-white/[0.08]" /><div className="mt-2 h-1.5 w-3/5 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 border-y border-slate-200/70 bg-white/40 dark:border-white/[0.06] dark:bg-white/[0.012]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">The workflow</p>
                <h2 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl dark:text-white">One project. Every useful angle.</h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-500 dark:text-zinc-400">Build in the mode that matches the moment. The workspace adapts while your project stays put.</p>
                <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Workflow steps">
                  {showcaseSteps.map((step) => {
                    const Icon = step.icon;
                    const isActive = step.id === activeStep;
                    return (
                      <button key={step.id} type="button" role="tab" aria-selected={isActive} onClick={() => setActiveStep(step.id)} className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:border-white/[0.16]"}`}>
                        <Icon size={14} /> {step.id}
                      </button>
                    );
                  })}
                </div>
              </div>
              <motion.div key={activeShowcase.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="grid gap-5 md:grid-cols-[1fr_0.85fr] md:items-center">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-[#101018] p-4 shadow-xl shadow-indigo-950/10 dark:border-white/[0.1]">
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-3 text-[10px] text-zinc-500"><span className="flex items-center gap-1.5"><Code2 size={11} className="text-indigo-400" /> {activeShowcase.file}</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></div>
                  <div className="space-y-1.5 font-mono text-[10px] leading-5 sm:text-[11px]">
                    {activeShowcase.lines.map((line, lineIndex) => (
                      <div key={`${activeShowcase.id}-${lineIndex}`} className="flex min-w-max gap-3"><span className="w-3 select-none text-right text-zinc-700">{lineIndex + 1}</span><span>{line.map((token, tokenIndex) => <span key={`${lineIndex}-${tokenIndex}`} className={codeTokenClass(tokenIndex)}>{token}</span>)}</span></div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-2 text-[10px] text-emerald-300"><Check size={11} /> {activeShowcase.status}</div>
                </div>
                <div>
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${activeShowcase.accent} text-white shadow-lg`}><ShowcaseIcon size={19} /></div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">{activeShowcase.eyebrow}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">{activeShowcase.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-zinc-400">{activeShowcase.description}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl"><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Made for the whole loop</p><h2 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl dark:text-white">Less context switching. More making.</h2></div>
            <p className="max-w-xs text-sm leading-6 text-slate-500 dark:text-zinc-400">A practical toolkit for the moments between “what if?” and “it works.”</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article key={feature.label} whileHover={{ y: -3 }} transition={{ duration: 0.18 }} className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 p-6 dark:border-white/[0.08] dark:bg-white/[0.025] ${feature.className || ""}`}>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex h-full min-h-[245px] flex-col">
                    <div className="mb-5 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><Icon size={18} /></div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-600">{feature.label}</span></div>
                    <h3 className="max-w-md text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">{feature.description}</p>
                    <div className="mt-auto pt-8">
                      {feature.visual === "chat" && <div className="grid max-w-md gap-1.5 text-[10px]"><div className="ml-auto w-3/5 rounded-lg rounded-br-sm bg-indigo-500/10 px-3 py-2 text-indigo-600 dark:text-indigo-200">Add a softer hover state</div><div className="w-4/5 rounded-lg rounded-bl-sm bg-slate-100 px-3 py-2 text-slate-500 dark:bg-white/[0.06] dark:text-zinc-300">I’ll tune the interaction and update the component.</div></div>}
                      {feature.visual === "editor" && <div className="rounded-lg bg-[#111118] p-3 font-mono text-[9px] leading-5 text-zinc-400"><span className="text-fuchsia-300">const</span> <span className="text-sky-300">draft</span> = <span className="text-emerald-300">useDraft</span>();<br /><span className="text-zinc-600">// keep the idea moving</span></div>}
                      {feature.visual === "preview" && <div className="flex h-16 items-center justify-center rounded-lg border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-violet-500/10"><div className="h-7 w-16 rounded border border-sky-400/40 bg-white/40 dark:bg-white/10" /></div>}
                      {feature.visual === "terminal" && <div className="rounded-lg bg-[#111118] p-3 font-mono text-[9px] leading-5 text-zinc-400"><span className="text-emerald-400">$</span> npm run build<br /><span className="text-emerald-400">✓</span> project ready in 1.2s</div>}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-slate-950 text-white dark:border-white/[0.06]" aria-labelledby="momentum-heading">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10">
            <div><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300">A workspace that keeps up</p><h2 id="momentum-heading" className="text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">The best tool is the one that keeps you in the idea.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">Start small, make it visible, then keep going. Dev-Verse Studio is designed to make the next useful action obvious.</p><Link to="/dashboard" className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-100">Try the workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ icon: Files, title: "Organize", copy: "Keep files and projects close." }, { icon: Layers3, title: "Iterate", copy: "Move between code and preview." }, { icon: Zap, title: "Ship", copy: "Use the next action, not ten tabs." }].map(({ icon: Icon, title, copy }, index) => <div key={title} className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-5"><div className="mb-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.08] text-indigo-300"><Icon size={17} /></div><p className="text-sm font-semibold">0{index + 1} / {title}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{copy}</p></div>)}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Simple when you’re ready</p><h2 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl dark:text-white">More room for the work.</h2><p className="mt-5 max-w-md text-base leading-7 text-slate-500 dark:text-zinc-400">Start free, find your rhythm, and add more AI credits when your projects get bigger.</p><Link to="/plan" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">Explore plans <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link></div>
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.12] via-white/70 to-violet-500/[0.08] p-6 shadow-xl shadow-indigo-950/5 sm:p-8 dark:from-indigo-500/[0.16] dark:via-white/[0.04] dark:to-violet-500/[0.12]">
              <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl" />
              <div className="relative grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end"><div><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"><Sparkles size={18} /></div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-300">Pro</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">For developers who build regularly.</h3><ul className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 dark:text-zinc-300"><li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> 500 AI credits</li><li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Larger projects</li><li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Priority generation</li><li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Priority support</li></ul></div><div className="sm:text-right"><p className="text-4xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">₹299<span className="text-sm font-medium text-slate-400"> /mo</span></p><Link to="/plan" className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100">View all plans</Link></div></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32" aria-labelledby="faq-heading">
          <div className="mb-8 text-center"><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Questions, answered</p><h2 id="faq-heading" className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl dark:text-white">A clear place to start.</h2></div>
          <div className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200/80 bg-white/60 px-5 dark:divide-white/[0.07] dark:border-white/[0.08] dark:bg-white/[0.025]">
            {faqs.map((faq, index) => { const isOpen = openFaq === index; return <div key={faq.question}><button type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:text-zinc-200"><span>{faq.question}</span><ChevronDown size={17} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>{isOpen && <p id={`faq-answer-${index}`} className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-slate-500 dark:text-zinc-400">{faq.answer}</p>}</div>; })}
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 sm:pb-32" aria-labelledby="cta-heading">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 px-6 py-16 text-center shadow-2xl shadow-indigo-950/20 sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
            <div className="relative"><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-100">Your next project is waiting</p><h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Give the idea somewhere to go.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">Open a workspace, make the first pass, and see how quickly a good idea can become something real.</p><Link to="/dashboard" className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-indigo-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-indigo-50">{dashboardLabel}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div><Link to="/" aria-label="Dev-Verse Studio home"><BrandMark /></Link><p className="mt-4 max-w-xs text-xs leading-5 text-slate-400 dark:text-zinc-500">A focused browser workspace for turning ideas into working software.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500 dark:text-zinc-500"><a href="#product" className="hover:text-slate-900 dark:hover:text-white">Product</a><a href="#workflow" className="hover:text-slate-900 dark:hover:text-white">Workflow</a><Link to="/plan" className="hover:text-slate-900 dark:hover:text-white">Pricing</Link><Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-white">Open Studio</Link></div>
          <p className="text-xs text-slate-400 dark:text-zinc-600">© {new Date().getFullYear()} Dev-Verse Studio</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
