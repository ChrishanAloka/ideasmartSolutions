const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainProject',
        required: true
    },
    type: {
        type: String,
        enum: ['Invoice', 'Quotation'],
        required: true
    },
    documentId: {
        type: String,
        required: true,
        unique: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    clientDetails: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    projectDetails: {
        name: String,
        description: String,
        startDate: Date
    },
    items: [{
        name: String,
        description: String,
        amount: Number,
        status: String
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    payments: [{
        date: Date,
        amount: Number,
        method: String,
        reference: String
    }],
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Accepted', 'Rejected'],
        default: 'Draft'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
