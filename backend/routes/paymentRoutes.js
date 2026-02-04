const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .get(protect, getPayment)
  .put(protect, updatePayment)
  .delete(protect, deletePayment);

module.exports = router;