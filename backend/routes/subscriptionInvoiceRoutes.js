const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSubscriptionInvoice,
  getSubscriptionInvoices,
  getSubProjectInvoices,
  createSubscriptionInvoice,
  updateSubscriptionInvoice,
  deleteSubscriptionInvoice,
  generateNextInvoice
} = require('../controllers/subscriptionInvoiceController');
const { protect } = require('../middleware/authMiddleware');

// Standalone routes
router.route('/')
  .post(protect, createSubscriptionInvoice);

router.route('/:id')
  .get(protect, getSubscriptionInvoice)
  .put(protect, updateSubscriptionInvoice)
  .delete(protect, deleteSubscriptionInvoice);

module.exports = router;