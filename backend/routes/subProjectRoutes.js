const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSubProjects,
  getSubProject,
  createSubProject,
  updateSubProject,
  deleteSubProject
} = require('../controllers/subProjectController');
const { getSubProjectInvoices, generateNextInvoice } = require('../controllers/subscriptionInvoiceController');
const { protect } = require('../middleware/authMiddleware');

// Routes that work both nested (/projects/:projectId/subprojects) 
// and standalone (/subprojects/:id)
router.route('/')
  .get(getSubProjects)
  .post(createSubProject);

router.route('/:id')
  .get(protect, getSubProject)
  .put(protect, updateSubProject)
  .delete(protect, deleteSubProject);

router.get('/:id/subscription-invoices', protect, getSubProjectInvoices);
router.post('/:id/generate-invoice', protect, generateNextInvoice);

module.exports = router;