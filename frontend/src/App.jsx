import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { me } from "./features/me";
import Dashboard from "./pages/Dashboard";
import {
  setAuthError,
  setAuthLoading,
  setUserData,
} from "./redux/userSlice";

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
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
