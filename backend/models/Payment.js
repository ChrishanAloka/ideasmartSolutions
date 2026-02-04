const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  mainProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainProject',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Online Payment', 'Other'],
    default: 'Cash'
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Update main project paid amount when payment is saved or deleted
paymentSchema.post('save', async function() {
  await this.updateMainProjectPaidAmount();
});

paymentSchema.post('remove', async function() {
  await this.updateMainProjectPaidAmount();
});

paymentSchema.methods.updateMainProjectPaidAmount = async function() {
  const MainProject = require('./MainProject');
  const payments = await mongoose.model('Payment').find({ mainProject: this.mainProject });
  
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  await MainProject.findByIdAndUpdate(this.mainProject, { paidAmount });
};

module.exports = mongoose.model('Payment', paymentSchema);