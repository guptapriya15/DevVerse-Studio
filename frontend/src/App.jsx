import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import { me } from "./features/me";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import { setAuthError, setAuthLoading, setUserData } from "./redux/userSlice";
import ProjectPage from "./pages/ProjectPage";
import Plan from "./pages/Plan";

function ProjectRoute() {
  const { id } = useParams();
  return <ProjectPage key={id} />;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await me();
        if (mounted) {
          dispatch(setUserData(data));
        }
      } catch (error) {
        if (mounted) {
          dispatch(
            setAuthError(
              error.response?.data?.message ||
                "We could not verify your session.",
            ),
          );
        }
      } finally {
        if (mounted) {
          dispatch(setAuthLoading(false));
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectRoute />} />
        <Route path="/plan" element={<Plan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
