const mongoose = require('mongoose');

const mainProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true
  },
  clientName: {
    type: String,
    required: [true, 'Please add a client name'],
    trim: true
  },
  clientEmail: {
    type: String,
    trim: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sub-projects
mainProjectSchema.virtual('subProjects', {
  ref: 'SubProject',
  localField: '_id',
  foreignField: 'mainProject'
});

// Calculate status based on sub-projects
mainProjectSchema.methods.calculateStatus = async function() {
  const SubProject = require('./SubProject');
  const subProjects = await SubProject.find({ mainProject: this._id });
  
  if (subProjects.length === 0) {
    return 'Planning';
  }
  
  const allCompleted = subProjects.every(sp => sp.status === 'Completed');
  const anyInProgress = subProjects.some(sp => sp.status === 'In Progress');
  const anyCancelled = subProjects.some(sp => sp.status === 'Cancelled');
  
  if (allCompleted) {
    return 'Completed';
  } else if (anyInProgress) {
    return 'In Progress';
  } else if (anyCancelled) {
    return 'On Hold';
  } else {
    return 'Planning';
  }
};

module.exports = mongoose.model('MainProject', mainProjectSchema);