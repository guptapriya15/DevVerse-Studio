import { api } from "../utils/axios";

export const createRootFolder = async (projectId, projectName) => {
  const { data } = await api.post("/api/file/create-root-folder", {
    projectId,
    projectName,
  });
  return data;
};

export const createFolder = async (projectId, name, parentId) => {
  const { data } = await api.post("/api/file/create-folder", {
    projectId,
    name,
    parentId,
  });
  return data;
};

export const createFile = async (
  projectId,
  name,
  parentId,
  content = "",
  language = "plaintext",
) => {
  const { data } = await api.post("/api/file/create-file", {
    projectId,
    name,
    parentId,
    content,
    language,
  });
  return data;
};

export const updateFile = async ({ name, content, id }) => {
  const { data } = await api.post(`/api/file/update/${id}`, {
    name,
    content,
  });
  return data;
};

export const deleteFile = async (id) => {
  const { data } = await api.delete(`/api/file/${id}`);
  return data;
};

export const getFile = async (id) => {
  const { data } = await api.get(`/api/file/${id}`);
  return data;
};

export const getTree = async (projectId) => {
  const { data } = await api.get(`/api/file/tree/${projectId}`);
  return data;
};
