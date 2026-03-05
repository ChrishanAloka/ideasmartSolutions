const Task = require('../models/Task');
const MainProject = require('../models/MainProject');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, priority, projectId, subProjectId } = req.query;

    let query = {};

    // Filter by role
    if (req.user.role === 'developer') {
      // Developers see tasks in projects they are part of (have assigned tasks in)
      // plus tasks assigned to them or created by them
      const assignedProjectIds = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
      query = {
        $or: [
          { mainProject: { $in: assignedProjectIds } },
          { assignedTo: req.user._id },
          { user: req.user._id }
        ]
      };
    } else if (req.user.role === 'admin') {
      // Admins see everything? Or maybe tasks they created + all project tasks?
      // Let's assume admins see everything.
      if (projectId && projectId !== 'none') {
        query.mainProject = projectId;
      }
    } else {
      // Regular users only see tasks they created
      query.user = req.user._id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId && projectId !== 'none' && req.user.role !== 'admin') {
      query.mainProject = projectId;
    }
    if (projectId === 'none') query.mainProject = null;
    if (subProjectId) query.subProject = subProjectId;

    const tasks = await Task.find(query)
      .populate('mainProject', 'name')
      .populate('subProject', 'name status')
      .populate('assignedTo', 'name email')
      .populate('user', 'name')
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
    const task = await Task.findById(req.params.id)
      .populate('mainProject', 'name')
      .populate('subProject', 'name status')
      .populate('assignedTo', 'name email')
      .populate('user', 'name');

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Role-based access
    if (req.user.role === 'developer') {
      const assignedProjectIds = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
      const isPartOfProject = assignedProjectIds.some(id => id.toString() === task.mainProject?.toString());
      if (!isPartOfProject &&
        task.assignedTo?.toString() !== req.user._id.toString() &&
        task.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
      }
    } else if (req.user.role !== 'admin' &&
      task.assignedTo?.toString() !== req.user._id.toString() &&
      task.user.toString() !== req.user._id.toString()) {
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
      if (!project) {
        res.status(404);
        throw new Error('Project not found');
      }

      // Role-based access for creating task in project
      if (req.user.role === 'developer') {
        // Developer can create task in project if they are assigned to it
        // Or if the project exists? Maybe developers can manage tasks for any project they can see?
        // Since getMainProjects only shows assigned projects, let's keep it consistent
        const isAssigned = await Task.findOne({
          mainProject: taskData.mainProject,
          assignedTo: req.user._id
        });
        if (!isAssigned && req.user.role !== 'admin') {
          res.status(401);
          throw new Error('Not authorized to create tasks for this project');
        }
      } else if (req.user.role !== 'admin' && project.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to create tasks for this project');
      }
    }

    // Validate sub-project if provided
    if (taskData.subProject) {
      const SubProject = require('../models/SubProject');
      const subProject = await SubProject.findById(taskData.subProject);
      if (!subProject || subProject.mainProject.toString() !== taskData.mainProject.toString()) {
        res.status(400);
        throw new Error('Invalid sub-project or sub-project does not belong to the selected project');
      }
    }

    const task = await Task.create(taskData);
    const populatedTask = await Task.findById(task._id)
      .populate('mainProject', 'name')
      .populate('subProject', 'name status');

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

    // Role-based access: Developers can update tasks in projects they are part of
    // or tasks assigned to them or created by them
    if (req.user.role === 'developer') {
      const assignedProjectIds = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
      const isPartOfProject = assignedProjectIds.some(id => id.toString() === task.mainProject?.toString());
      if (!isPartOfProject &&
        task.assignedTo?.toString() !== req.user._id.toString() &&
        task.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to update this task');
      }
    } else if (req.user.role !== 'admin' &&
      task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this task');
    }

    // Validate project if provided
    if (req.body.mainProject) {
      const project = await MainProject.findById(req.body.mainProject);
      if (!project) {
        res.status(404);
        throw new Error('Project not found');
      }

      // Check if user is allowed to move task to this project
      if (req.user.role !== 'admin') {
        if (req.user.role === 'developer') {
          const assignedProjectIds = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
          const isAssigned = assignedProjectIds.some(id => id.toString() === project._id.toString());
          if (!isAssigned) {
            res.status(401);
            throw new Error('Not authorized to assign tasks to this project');
          }
        } else if (project.user.toString() !== req.user._id.toString()) {
          res.status(401);
          throw new Error('Not authorized to assign tasks to this project');
        }
      }
    }

    // Validate sub-project if provided
    if (req.body.subProject) {
      const SubProject = require('../models/SubProject');
      const subProject = await SubProject.findById(req.body.subProject);
      const projectId = req.body.mainProject || task.mainProject;
      if (!subProject || subProject.mainProject.toString() !== projectId.toString()) {
        res.status(400);
        throw new Error('Invalid sub-project or sub-project does not belong to the selected project');
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('mainProject', 'name').populate('subProject', 'name status');

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

    // Role-based access for deletion
    if (req.user.role === 'developer') {
      const assignedProjectIds = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
      const isPartOfProject = assignedProjectIds.some(id => id.toString() === task.mainProject?.toString());
      if (!isPartOfProject && task.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this task');
      }
    } else if (req.user.role !== 'admin' && task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this task');
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
    let query = {};
    if (req.user.role === 'developer') {
      // Stats cover all tasks in projects the developer is part of
      const assignedProjectIds = await Task.find({ assignedTo: req.user._id }).distinct('mainProject');
      query = {
        $or: [
          { mainProject: { $in: assignedProjectIds } },
          { assignedTo: req.user._id },
          { user: req.user._id }
        ]
      };
    } else if (req.user.role === 'admin') {
      // Admins see everything
    } else {
      query.user = req.user._id;
    }

    const tasks = await Task.find(query);

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