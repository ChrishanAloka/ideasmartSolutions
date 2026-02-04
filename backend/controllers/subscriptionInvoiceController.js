const SubscriptionInvoice = require('../models/SubscriptionInvoice');
const SubProject = require('../models/SubProject');
const MainProject = require('../models/MainProject');

// @desc    Get single subscription invoice
// @route   GET /api/subscription-invoices/:id
// @access  Private
const getSubscriptionInvoice = async (req, res) => {
  try {
    const invoice = await SubscriptionInvoice.findById(req.params.id)
      .populate('mainProject', 'name clientName clientEmail clientPhone')
      .populate('subProject', 'name subscriptionType');

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    const mainProject = await MainProject.findById(invoice.mainProject);
    if (mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all subscription invoices for a project
// @route   GET /api/projects/:projectId/subscription-invoices
// @access  Private
const getSubscriptionInvoices = async (req, res) => {
  try {
    const mainProject = await MainProject.findById(req.params.projectId);
    
    if (!mainProject) {
      res.status(404);
      throw new Error('Main project not found');
    }

    if (mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const invoices = await SubscriptionInvoice.find({ mainProject: req.params.projectId })
      .populate('subProject', 'name subscriptionType')
      .sort({ billingPeriodStart: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get subscription invoices for a sub-project
// @route   GET /api/subprojects/:id/subscription-invoices
// @access  Private
const getSubProjectInvoices = async (req, res) => {
  try {
    const subProject = await SubProject.findById(req.params.id);
    
    if (!subProject) {
      res.status(404);
      throw new Error('Sub-project not found');
    }

    const mainProject = await MainProject.findById(subProject.mainProject);
    if (mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const invoices = await SubscriptionInvoice.find({ subProject: req.params.id })
      .sort({ billingPeriodStart: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create subscription invoice
// @route   POST /api/subscription-invoices
// @access  Private
const createSubscriptionInvoice = async (req, res) => {
  try {
    const { mainProject, subProject, billingPeriodStart, billingPeriodEnd, amount, dueDate } = req.body;

    // Verify ownership
    const project = await MainProject.findById(mainProject);
    if (!project || project.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const invoice = await SubscriptionInvoice.create({
      mainProject,
      subProject,
      billingPeriodStart,
      billingPeriodEnd,
      amount,
      dueDate
    });

    const populatedInvoice = await SubscriptionInvoice.findById(invoice._id)
      .populate('mainProject', 'name clientName')
      .populate('subProject', 'name subscriptionType');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update subscription invoice
// @route   PUT /api/subscription-invoices/:id
// @access  Private
const updateSubscriptionInvoice = async (req, res) => {
  try {
    const invoice = await SubscriptionInvoice.findById(req.params.id).populate('mainProject');

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    const mainProject = await MainProject.findById(invoice.mainProject);
    if (mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Auto-set paid date when status changes to Paid
    if (req.body.status === 'Paid' && !invoice.paidDate) {
      req.body.paidDate = new Date();
    }

    const updatedInvoice = await SubscriptionInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('mainProject', 'name clientName')
     .populate('subProject', 'name subscriptionType');

    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete subscription invoice
// @route   DELETE /api/subscription-invoices/:id
// @access  Private
const deleteSubscriptionInvoice = async (req, res) => {
  try {
    const invoice = await SubscriptionInvoice.findById(req.params.id).populate('mainProject');

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    const mainProject = await MainProject.findById(invoice.mainProject);
    if (mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await invoice.deleteOne();

    res.json({ message: 'Invoice removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate next invoice for subscription
// @route   POST /api/subprojects/:id/generate-invoice
// @access  Private
const generateNextInvoice = async (req, res) => {
  try {
    const subProject = await SubProject.findById(req.params.id);
    
    if (!subProject) {
      res.status(404);
      throw new Error('Sub-project not found');
    }

    if (!subProject.isSubscription) {
      res.status(400);
      throw new Error('This sub-project is not a subscription');
    }

    const mainProject = await MainProject.findById(subProject.mainProject);
    
    if (!mainProject) {
      res.status(404);
      throw new Error('Main project not found');
    }

    if (mainProject.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Calculate billing period
    const startDate = subProject.lastBilledDate || subProject.subscriptionStartDate || new Date();
    const endDate = new Date(startDate);
    
    if (subProject.subscriptionType === 'Monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subProject.subscriptionType === 'Yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const dueDate = new Date(endDate);
    dueDate.setDate(dueDate.getDate() + 7); // 7 days after period end

    const invoice = await SubscriptionInvoice.create({
      mainProject: subProject.mainProject,
      subProject: subProject._id,
      billingPeriodStart: startDate,
      billingPeriodEnd: endDate,
      amount: subProject.price,
      dueDate
    });

    // Update sub-project billing dates
    subProject.lastBilledDate = startDate;
    subProject.nextBillingDate = endDate;
    await subProject.save();

    const populatedInvoice = await SubscriptionInvoice.findById(invoice._id)
      .populate('mainProject', 'name clientName')
      .populate('subProject', 'name subscriptionType');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSubscriptionInvoice,
  getSubscriptionInvoices,
  getSubProjectInvoices,
  createSubscriptionInvoice,
  updateSubscriptionInvoice,
  deleteSubscriptionInvoice,
  generateNextInvoice
};