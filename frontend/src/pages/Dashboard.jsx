import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { Folder, Loader2, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { FcGoogle } from "react-icons/fc";
import { auth, googleProvider } from "../../firebase";
import { login } from "../features/login";
import CreateProjectModal from "../components/CreateProjectModal";
import NavBar from "../components/NavBar";
import ProjectCard from "../components/ProjectCard";
import SideBar from "../components/SideBar";
import { clearProjects, fetchProjects } from "../redux/projectSlice";
import { setUserData } from "../redux/userSlice";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const LoadingScreen = () => (
  <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 transition-colors duration-300 dark:bg-[#07070c]">
    <Loader2 size={28} className="animate-spin text-slate-400 dark:text-slate-500" />
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [activeSession, setActiveSession] = useState("projects");
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useDispatch();
  const { userData, authLoading, authError } = useSelector((state) => state.user);
  const { projects = [], loading: loadingProjects, error: projectError } = useSelector(
    (state) => state.project,
  );

  const handleLogin = async () => {
    setLoading(true);
    setLoginError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const data = await login(token);

      if (!data) {
        throw new Error("The login service did not return a user.");
      }

      dispatch(setUserData(data));
    } catch (error) {
      setLoginError(
        getErrorMessage(error, "Unable to sign in. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!userData) {
      dispatch(clearProjects());
      return;
    }

    dispatch(fetchProjects(activeSession));
  }, [activeSession, authLoading, dispatch, userData]);

  const handleProjectCreated = () => {
    setOpenModal(false);
    dispatch(fetchProjects(activeSession));
  };

  const refreshProjects = () => {
    dispatch(fetchProjects(activeSession));
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!userData) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 transition-colors duration-300 dark:bg-[#07070c]">
        <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[120px] dark:block" />
        <div className="relative w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-black/40">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5 dark:border-transparent">
            <span className="text-lg font-bold">AI</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            Welcome to Dev-Verse Studio
          </h2>
          <p className="mb-6 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            Sign in to access your projects and continue building.
          </p>
          {(loginError || authError) && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-left text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {loginError || authError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-2.5 text-[13.5px] font-medium text-slate-800 shadow-sm transition-colors duration-150 hover:bg-slate-50 disabled:opacity-70 dark:border-transparent dark:bg-white dark:hover:bg-slate-100"
          >
            <FcGoogle />
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
          <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-600">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[#07070c]">
      <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-[700px] w-[700px] rounded-full bg-white/[0.04] blur-[140px] dark:block" />
      <div className="pointer-events-none absolute right-0 top-1/3 hidden h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[130px] dark:block" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <NavBar />
        <div className="flex min-h-0 flex-1">
          <SideBar
            activeSession={activeSession}
            setActiveSession={setActiveSession}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 [scrollbar-width:thin] [scrollbar-color:rgba(100,116,139,0.35)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-[26px] font-bold text-slate-900 dark:text-white">
                  Welcome Back, {userData?.name?.split(" ")[0] || "User"}
                  <span>👋🏻</span>
                </h1>
                <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
                  Ready to build something amazing today?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-opacity duration-150 hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">
                {activeSession === "starred"
                  ? "Starred Projects"
                  : "Recent Projects"}
              </h2>
            </div>

            {projectError && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                <span>{projectError}</span>
                <button
                  type="button"
                  onClick={refreshProjects}
                  className="font-medium underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            )}

            {loadingProjects ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2
                  size={28}
                  className="animate-spin text-slate-400 dark:text-slate-500"
                />
              </div>
            ) : projects.length === 0 ? (
              <div className="mb-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 py-16 text-center dark:border-white/[0.1] dark:bg-white/[0.01]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/10">
                  <Folder
                    size={24}
                    className="text-slate-500 dark:text-white"
                  />
                </div>
                <h3 className="mb-1.5 text-[16px] font-semibold text-slate-900 dark:text-white">
                  {activeSession === "starred"
                    ? "No starred projects"
                    : "No projects yet"}
                </h3>
                <p className="mb-5 max-w-xs text-[13px] text-slate-500 dark:text-slate-500">
                  {activeSession === "starred"
                    ? "Star a project to see it here"
                    : "Create your first project and start building something amazing!"}
                </p>
              </div>
            ) : (
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onChanged={refreshProjects}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <CreateProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
