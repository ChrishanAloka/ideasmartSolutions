const SubProject = require('../models/SubProject');
const MainProject = require('../models/MainProject');

// @desc    Get all sub-projects for a main project
// @route   GET /api/projects/:projectId/subprojects
// @access  Private
const getSubProjects = async (req, res) => {
  try {
    // Verify main project exists and user has access
    const mainProject = await MainProject.findById(req.params.projectId);

    if (!mainProject) {
      res.status(404);
      throw new Error('Main project not found');
    }

    // Check user access: Admin, Owner, or Developer with task
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      if (req.user.role === 'developer') {
        const Task = require('../models/Task');
        const hasTask = await Task.findOne({ mainProject: mainProject._id, assignedTo: req.user._id });
        if (!hasTask) {
          res.status(401);
          throw new Error('Not authorized to view sub-projects');
        }
      } else {
        res.status(401);
        throw new Error('Not authorized');
      }
    }

    const subProjects = await SubProject.find({ mainProject: req.params.projectId })
      .sort({ createdAt: -1 });

    res.json(subProjects);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single sub-project
// @route   GET /api/subprojects/:id
// @access  Private
const getSubProject = async (req, res) => {
  try {
    const subProject = await SubProject.findById(req.params.id).populate('mainProject');

    if (!subProject) {
      res.status(404);
      throw new Error('Sub-project not found');
    }

    // Check user ownership through main project
    // Check user access: Admin, Owner, or Developer with task
    const mainProject = await MainProject.findById(subProject.mainProject);
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      if (req.user.role === 'developer') {
        const Task = require('../models/Task');
        const hasTask = await Task.findOne({ mainProject: mainProject._id, assignedTo: req.user._id });
        if (!hasTask) {
          res.status(401);
          throw new Error('Not authorized to view sub-project');
        }
      } else {
        res.status(401);
        throw new Error('Not authorized');
      }
    }

    res.json(subProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create sub-project
// @route   POST /api/projects/:projectId/subprojects
// @access  Private
const createSubProject = async (req, res) => {
  try {
    // Verify main project exists and user has access
    const mainProject = await MainProject.findById(req.params.projectId);

    if (!mainProject) {
      res.status(404);
      throw new Error('Main project not found');
    }

    // Restricted to Admin or Owner
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to create sub-projects');
    }

    const subProject = await SubProject.create({
      ...req.body,
      mainProject: req.params.projectId
    });

    // Update main project total
    const subProjects = await SubProject.find({ mainProject: req.params.projectId });
    const totalAmount = subProjects.reduce((sum, sp) => sum + sp.price, 0);
    mainProject.totalAmount = totalAmount;
    await mainProject.save();

    res.status(201).json(subProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update sub-project
// @route   PUT /api/subprojects/:id
// @access  Private
const updateSubProject = async (req, res) => {
  try {
    const subProject = await SubProject.findById(req.params.id);

    if (!subProject) {
      res.status(404);
      throw new Error('Sub-project not found');
    }

    // Check user ownership through main project
    // Restricted to Admin or Owner
    const mainProject = await MainProject.findById(subProject.mainProject);
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update sub-project');
    }

    // If status is being updated to Completed, set completed date
    if (req.body.status === 'Completed' && subProject.status !== 'Completed') {
      req.body.completedDate = new Date();
    }

    const updatedSubProject = await SubProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update main project total
    const subProjects = await SubProject.find({ mainProject: subProject.mainProject });
    const totalAmount = subProjects.reduce((sum, sp) => sum + sp.price, 0);
    mainProject.totalAmount = totalAmount;

    // Update main project status
    const newStatus = await mainProject.calculateStatus();
    mainProject.status = newStatus;
    await mainProject.save();

    res.json(updatedSubProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete sub-project
// @route   DELETE /api/subprojects/:id
// @access  Private
const deleteSubProject = async (req, res) => {
  try {
    const subProject = await SubProject.findById(req.params.id);

    if (!subProject) {
      res.status(404);
      throw new Error('Sub-project not found');
    }

    // Check user ownership through main project
    // Restricted to Admin or Owner
    const mainProject = await MainProject.findById(subProject.mainProject);
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete sub-project');
    }

    await subProject.deleteOne();

    // Update main project total
    const subProjects = await SubProject.find({ mainProject: subProject.mainProject });
    const totalAmount = subProjects.reduce((sum, sp) => sum + sp.price, 0);
    mainProject.totalAmount = totalAmount;
    await mainProject.save();

    res.json({ message: 'Sub-project removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSubProjects,
  getSubProject,
  createSubProject,
  updateSubProject,
  deleteSubProject
};