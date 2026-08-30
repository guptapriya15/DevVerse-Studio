import redis from "../../../shared/redis/redis.js";
import Project from "../models/project.model.js";

export const createProject = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ message: "userid is required" });
    }

    const { name, description } = req.body;
    const project = await Project.create({
      owner: userId,
      name,
      description,
    });

    const key = `projects-${userId}`;

    await redis.del(key);

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: `Create Project Error ${error}` });
  }
};

export const getProjects = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ message: "userid is required" });
    }

    const key = `projects-${userId}`;

    const result = await redis.get(key);
    if (result) {
      return res.status(200).json(JSON.parse(result));
    }

    const projects = await Project.find({
      owner: userId,
    }).sort({ updatedAt: -1 });

    await redis.set(key, JSON.stringify(projects));
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: `Get Projects Error ${error}` });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "userid is required" });
    }

    const project = await Project.findOne({
      _id: id,
      owner: userId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project Not Found" });
    }

    project.lastOpenedAt = new Date();
    await project.save();

    return res.status(200).json(project);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Get Project By Id Error ${error}` });
  }
};

export const getStarredProjects = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ message: "userid is required" });
    }

    const key = `starred-projects-${userId}`;
    let result = await redis.get(key);
    if (result) {
      return res.status(200).json(JSON.parse(result));
    }

    const projects = await Project.find({
      owner: userId,
      starred: true,
    }).sort({ updatedAt: -1 });

    await redis.set(key, JSON.stringify(projects));

    return res.status(200).json(projects);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Get Starred Projects Error ${error}` });
  }
};

export const toggleStar = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "userid is required" });
    }
    const project = await Project.findOne({
      _id: id,
      owner: userId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project Not Found" });
    }
    project.starred = !project.starred;
    await project.save();

    await redis.del(`projects-${userId}`);
    await redis.del(`starred-projects-${userId}`);

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: `Toggle Star Error ${error}` });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "userid is required" });
    }
    const project = await Project.findOneAndDelete({ _id: id, owner: userId });
    if (!project) {
      return res.status(404).json({ message: "Project Not Found" });
    }
    await redis.del(`projects-${userId}`);
    await redis.del(`starred-projects-${userId}`);

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: `Project Delete Error ${error}` });
  }
};
