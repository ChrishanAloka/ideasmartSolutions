const express = require('express');
const router = express.Router();
const {
  getMainProjects,
  getMainProject,
  createMainProject,
  updateMainProject,
  deleteMainProject,
  updateMainProjectStatus
} = require('../controllers/mainProjectController');
const { protect } = require('../middleware/authMiddleware');

// Sub-project routes
const subProjectRoutes = require('./subProjectRoutes');
const paymentRoutes = require('./paymentRoutes');
const { getSubscriptionInvoices, generateNextInvoice } = require('../controllers/subscriptionInvoiceController');

router.use('/:projectId/subprojects', protect, subProjectRoutes);
router.use('/:projectId/payments', protect, paymentRoutes);
router.get('/:projectId/subscription-invoices', protect, getSubscriptionInvoices);
router.post('/subprojects/:subProjectId/generate-invoice', protect, generateNextInvoice);

router.route('/')
  .get(protect, getMainProjects)
  .post(protect, createMainProject);

router.route('/:id')
  .get(protect, getMainProject)
  .put(protect, updateMainProject)
  .delete(protect, deleteMainProject);

router.put('/:id/update-status', protect, updateMainProjectStatus);

module.exports = router;