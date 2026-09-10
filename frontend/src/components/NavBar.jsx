import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { FiMoon } from "react-icons/fi";
import { IoSunnyOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/logout";
import { clearProjects } from "../redux/projectSlice";
import { setUserData } from "../redux/userSlice";

const getInitialTheme = () => {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem("theme") !== "light";
  } catch {
    return true;
  }
};

const NavBar = () => {
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const name = userData?.name || "Guest";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError(null);

    try {
      await logout();
      dispatch(setUserData(null));
      dispatch(clearProjects());
      setMenuOpen(false);
    } catch (error) {
      setLogoutError(
        error.response?.data?.message ||
          error.message ||
          "Unable to log out. Please try again.",
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);

    try {
      window.localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Theme state still updates when storage is unavailable.
    }
  };

  return (
    <div className="flex h-16 w-full items-center gap-6 border-b border-slate-200 bg-white/70 px-6 font-sans backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
          Dev-Verse Studio
        </span>
      </div>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          {isDark ? <FiMoon size={18} /> : <IoSunnyOutline size={18} />}
        </button>
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            className="flex h-10 items-center gap-2 rounded-lg pl-1.5 pr-2 transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-600 to-slate-700 ring-black/5 dark:from-slate-200 dark:to-white dark:ring-white/20">
              <span className="text-[12px] font-semibold text-white dark:text-slate-900">
                {initials}
              </span>
            </div>
            <span className="hidden text-[13.5px] font-medium text-slate-700 dark:text-slate-200 sm:inline">
              {name}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-150 dark:text-slate-500 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white/95 py-1.5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#12121c]/95">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 dark:border-white/[0.06]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 ring-1 ring-black/5 dark:from-slate-200 dark:to-white dark:ring-white/20">
                  <span className="text-[12px] font-semibold text-white dark:text-slate-900">
                    {initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                    {name}
                  </p>
                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {userData?.email}
                  </p>
                </div>
              </div>
              {logoutError && (
                <p className="px-3.5 py-2 text-xs text-red-500 dark:text-red-400">
                  {logoutError}
                </p>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 transition-colors duration-150 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut size={15} />
                {logoutLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
