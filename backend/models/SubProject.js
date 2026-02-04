const mongoose = require('mongoose');

const subProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a sub-project name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Not Started'
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionType: {
    type: String,
    enum: ['None', 'Monthly', 'Yearly'],
    default: 'None'
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  lastBilledDate: {
    type: Date
  },
  nextBillingDate: {
    type: Date
  },
  mainProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainProject',
    required: true
  },
  completedDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Update main project total amount when sub-project is saved or deleted
subProjectSchema.post('save', async function() {
  await this.updateMainProjectTotal();
});

subProjectSchema.post('remove', async function() {
  await this.updateMainProjectTotal();
});

subProjectSchema.methods.updateMainProjectTotal = async function() {
  const MainProject = require('./MainProject');
  const subProjects = await mongoose.model('SubProject').find({ mainProject: this.mainProject });
  
  // Only count non-subscription or one-time prices for total
  const totalAmount = subProjects.reduce((sum, sp) => {
    if (!sp.isSubscription) {
      return sum + sp.price;
    }
    return sum;
  }, 0);
  
  await MainProject.findByIdAndUpdate(this.mainProject, { totalAmount });
};

// Calculate next billing date
subProjectSchema.methods.calculateNextBillingDate = function() {
  if (!this.isSubscription || !this.lastBilledDate) return null;
  
  const nextDate = new Date(this.lastBilledDate);
  
  if (this.subscriptionType === 'Monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (this.subscriptionType === 'Yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  
  return nextDate;
};

module.exports = mongoose.model('SubProject', subProjectSchema);