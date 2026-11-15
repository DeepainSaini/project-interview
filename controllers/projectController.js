const { Project, ProjectSourceVersion } = require('../models');

const createProject = async (req, res) => {
  const { title, description } = req.body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      message: 'Project title is required.',
    });
  }

  if (title.trim().length > 255) {
    return res.status(400).json({
      message: 'Title must not exceed 255 characters.',
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      message: 'Description must be text.',
    });
  }

  try {
    const project = await Project.create({
      userId: req.session.userId,
      title: title.trim(),
      description: description?.trim() || null,
    });

    return res.status(201).json({
      message: 'Project created.',
      project,
    });
  } catch (error) {
    console.error('Project creation failed:', error.name);

    return res.status(500).json({
      message: 'Unable to create project.',
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { userId: req.session.userId },
      order: [['createdAt', 'DESC']],
    });

    return res.json({ projects });
  } catch (error) {
    console.error('Loading projects failed:', error.name);

    return res.status(500).json({
      message: 'Unable to load projects.',
    });
  }
};

const getProject = async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
        userId: req.session.userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    return res.json({ project });
  } catch (error) {
    console.error('Loading project failed:', error.name);

    return res.status(500).json({
      message: 'Unable to load project.',
    });
  }
};

const saveSourceVersion = async (req, res) => {
  const projectId = Number(req.params.id);
  const { sourceType, content } = req.body || {};

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  if (!['notes', 'readme'].includes(sourceType)) {
    return res.status(400).json({
      message: 'Source type must be notes or readme.',
    });
  }

  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      message: 'Content is required.',
    });
  }

  if (Buffer.byteLength(content, 'utf8') > 65535) {
    return res.status(400).json({
      message: 'Content exceeds the 65,535-byte text limit.',
    });
  }

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
        userId: req.session.userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    const source = await ProjectSourceVersion.create({
      projectId: project.id,
      sourceType,
      content,
    });

    return res.status(201).json({
      message: 'Source version saved.',
      source,
    });
  } catch (error) {
    console.error('Saving source failed:', error.name);

    return res.status(500).json({
      message: 'Unable to save source.',
    });
  }
};

const getLatestSources = async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
        userId: req.session.userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    const notes = await ProjectSourceVersion.findOne({
      where: { projectId, sourceType: 'notes' },
      order: [['id', 'DESC']],
    });

    const readme = await ProjectSourceVersion.findOne({
      where: { projectId, sourceType: 'readme' },
      order: [['id', 'DESC']],
    });

    return res.json({ notes, readme });
  } catch (error) {
    console.error('Loading sources failed:', error.name);

    return res.status(500).json({
      message: 'Unable to load sources.',
    });
  }
};

const getSourceHistory = async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
        userId: req.session.userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    const history = await ProjectSourceVersion.findAll({
      where: { projectId },
      attributes: ['id', 'sourceType', 'content', 'createdAt'],
      order: [['id', 'DESC']],
    });

    return res.json({ history });
  } catch (error) {
    console.error('Loading history failed:', error.name);

    return res.status(500).json({
      message: 'Unable to load history.',
    });
  }
};

module.exports = { 
  createProject, 
  getProjects, 
  getProject,
  saveSourceVersion, 
  getLatestSources,  
  getSourceHistory
};