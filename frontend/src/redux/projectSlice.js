import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getProjects, getStarredProjects } from "../features/project";

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Unable to load projects.";

export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (session, { rejectWithValue }) => {
    try {
      const projects =
        session === "starred"
          ? await getStarredProjects()
          : await getProjects();

      if (!Array.isArray(projects)) {
        throw new Error("The project response was not a list.");
      }

      return { session, projects };
    } catch (error) {
      return rejectWithValue({
        session,
        message: getErrorMessage(error),
      });
    }
  },
);

const initialState = {
  projects: [],
  loading: false,
  error: null,
  activeSession: null,
  requestId: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    addNewProject: (state, action) => {
      if (action.payload && typeof action.payload === "object") {
        state.projects.unshift(action.payload);
      }
    },
    clearProjects: () => initialState,
    updateProject: (state, action) => {
      const index = state.projects.findIndex(
        (project) => project._id === action.payload?._id,
      );
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    setDeleteProject: (state, action) => {
      state.projects = state.projects.filter(
        (project) => project._id !== action.payload,
      );
    },
    starProject: (state, action) => {
      const project = state.projects.find(
        (item) => item._id === action.payload,
      );
      if (project) {
        project.starred = !project.starred;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeSession = action.meta.arg;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        if (
          state.requestId !== action.meta.requestId ||
          state.activeSession !== action.payload.session
        ) {
          return;
        }

        state.projects = action.payload.projects;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        const session = action.payload?.session ?? action.meta.arg;
        if (
          state.requestId !== action.meta.requestId ||
          state.activeSession !== session
        ) {
          return;
        }

        state.projects = [];
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      });
  },
});

export const {
  addNewProject,
  starProject,
  clearProjects,
  updateProject,
  setDeleteProject,
} = projectSlice.actions;

export default projectSlice.reducer;
