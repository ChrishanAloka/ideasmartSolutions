const Payment = require('../models/Payment');
const MainProject = require('../models/MainProject');

// @desc    Get all payments for a main project
// @route   GET /api/projects/:projectId/payments
// @access  Private
const getPayments = async (req, res) => {
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
          throw new Error('Not authorized to view payments');
        }
      } else {
        res.status(401);
        throw new Error('Not authorized');
      }
    }

    const payments = await Payment.find({ mainProject: req.params.projectId })
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('mainProject');

    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    // Check user ownership through main project
    // Check user access: Admin, Owner, or Developer with task
    const mainProject = await MainProject.findById(payment.mainProject);
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      if (req.user.role === 'developer') {
        const Task = require('../models/Task');
        const hasTask = await Task.findOne({ mainProject: mainProject._id, assignedTo: req.user._id });
        if (!hasTask) {
          res.status(401);
          throw new Error('Not authorized to view payment');
        }
      } else {
        res.status(401);
        throw new Error('Not authorized');
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create payment
// @route   POST /api/projects/:projectId/payments
// @access  Private
const createPayment = async (req, res) => {
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
      throw new Error('Not authorized to create payments');
    }

    const payment = await Payment.create({
      ...req.body,
      mainProject: req.params.projectId
    });

    // Update main project paid amount
    const payments = await Payment.find({ mainProject: req.params.projectId });
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    mainProject.paidAmount = paidAmount;
    await mainProject.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    // Check user ownership through main project
    // Restricted to Admin or Owner
    const mainProject = await MainProject.findById(payment.mainProject);
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update payment');
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update main project paid amount
    const payments = await Payment.find({ mainProject: payment.mainProject });
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    mainProject.paidAmount = paidAmount;
    await mainProject.save();

    res.json(updatedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    // Check user ownership through main project
    // Restricted to Admin or Owner
    const mainProject = await MainProject.findById(payment.mainProject);
    if (req.user.role !== 'admin' && mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete payment');
    }

    await payment.deleteOne();

    // Update main project paid amount
    const payments = await Payment.find({ mainProject: payment.mainProject });
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    mainProject.paidAmount = paidAmount;
    await mainProject.save();

    res.json({ message: 'Payment removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment
};