const express = require('express');
const router = express.Router();
const {
    createInvoice,
    getProjectInvoices,
    getInvoice,
    deleteInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

// /api/invoices
router.post('/', protect, createInvoice);
router.get('/:id', protect, getInvoice);
router.delete('/:id', protect, deleteInvoice);
router.get('/project/:projectId', protect, getProjectInvoices);

module.exports = router;
