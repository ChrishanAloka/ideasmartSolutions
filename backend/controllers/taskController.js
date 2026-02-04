const Task = require('../models/Task');
const MainProject = require('../models/MainProject');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, priority, projectId } = req.query;
    
    let query = { user: req.user._id };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId && projectId !== 'none') query.mainProject = projectId;
    if (projectId === 'none') query.mainProject = null;
    
    const tasks = await Task.find(query)
      .populate('mainProject', 'name')
      .sort({ deadline: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('mainProject', 'name');

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user: req.user._id
    };

    // Validate project if provided
    if (taskData.mainProject) {
      const project = await MainProject.findById(taskData.mainProject);
      if (!project || project.user.toString() !== req.user._id.toString()) {
        res.status(400);
        throw new Error('Invalid project');
      }
    }

    const task = await Task.create(taskData);
    const populatedTask = await Task.findById(task._id).populate('mainProject', 'name');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Validate project if provided
    if (req.body.mainProject) {
      const project = await MainProject.findById(req.body.mainProject);
      if (!project || project.user.toString() !== req.user._id.toString()) {
        res.status(400);
        throw new Error('Invalid project');
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('mainProject', 'name');

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await task.deleteOne();

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    
    const stats = {
      total: tasks.length,
      toDo: tasks.filter(t => t.status === 'To Do').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      overdue: tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Completed').length,
      highPriority: tasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length
    };
    
    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
};