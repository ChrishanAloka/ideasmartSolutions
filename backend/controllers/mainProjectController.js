const MainProject = require('../models/MainProject');
const SubProject = require('../models/SubProject');

// @desc    Get all main projects
// @route   GET /api/projects
// @access  Private
const getMainProjects = async (req, res) => {
  try {
    let query = { user: req.user._id };

    // Developers see projects they have tasks assigned in?
    // Or maybe developers see all projects? Let's assume developers see all projects for now but can't edit.
    if (req.user.role === 'admin' || req.user.role === 'developer') {
      query = {}; // Admins and developers see all? 
      // Actually, let's keep it restricted to owners unless it's an admin.
      if (req.user.role === 'admin') query = {};
      else if (req.user.role === 'developer') {
        // Developers only see projects where they have assigned tasks
        const Task = require('../models/Task');
        const assignedTaskProjects = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
        query = { _id: { $in: assignedTaskProjects } };
      }
    }

    const projects = await MainProject.find(query)
      .populate('subProjects')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single main project
// @route   GET /api/projects/:id
// @access  Private
const getMainProject = async (req, res) => {
  try {
    const project = await MainProject.findById(req.params.id).populate('subProjects');

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Check user access
    if (req.user.role !== 'admin' && project.user.toString() !== req.user._id.toString()) {
      // Check if developer has a task in this project
      if (req.user.role === 'developer') {
        const Task = require('../models/Task');
        const hasTask = await Task.findOne({ mainProject: project._id, assignedTo: req.user._id });
        if (!hasTask) {
          res.status(401);
          throw new Error('Not authorized to view this project');
        }
      } else {
        res.status(401);
        throw new Error('Not authorized');
      }
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create main project
// @route   POST /api/projects
// @access  Private
const createMainProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'user') {
      res.status(401);
      throw new Error('Not authorized to create projects');
    }
    const project = await MainProject.create({
      ...req.body,
      user: req.user._id
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update main project
// @route   PUT /api/projects/:id
// @access  Private
const updateMainProject = async (req, res) => {
  try {
    const project = await MainProject.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Check user access: Admin or Owner
    if (req.user.role !== 'admin' && project.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this project');
    }

    const updatedProject = await MainProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subProjects');

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete main project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteMainProject = async (req, res) => {
  try {
    const project = await MainProject.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Check user access: Admin or Owner
    if (req.user.role !== 'admin' && project.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this project');
    }

    // Delete all sub-projects
    await SubProject.deleteMany({ mainProject: req.params.id });

    await project.deleteOne();

    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update main project status based on sub-projects
// @route   PUT /api/projects/:id/update-status
// @access  Private
const updateMainProjectStatus = async (req, res) => {
  try {
    const project = await MainProject.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Check user access: Admin or Owner
    if (req.user.role !== 'admin' && project.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update status');
    }

    const newStatus = await project.calculateStatus();
    project.status = newStatus;
    await project.save();

    const updatedProject = await MainProject.findById(req.params.id).populate('subProjects');

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getMainProjects,
  getMainProject,
  createMainProject,
  updateMainProject,
  deleteMainProject,
  updateMainProjectStatus
};