const Invoice = require('../models/Invoice');
const MainProject = require('../models/MainProject');
const SubProject = require('../models/SubProject');
const Payment = require('../models/Payment');

// Generate unique ID (INV-YYYY-0001)
const generateId = async (type) => {
    const prefix = type === 'Invoice' ? 'INV' : 'QTN';
    const year = new Date().getFullYear();

    // Find the latest document of this type for the current year
    const latestDoc = await Invoice.findOne({
        type,
        documentId: new RegExp(`^${prefix}-${year}-`)
    }).sort({ createdAt: -1 });

    let number = 1;
    if (latestDoc) {
        const parts = latestDoc.documentId.split('-');
        if (parts.length === 3) {
            number = parseInt(parts[2]) + 1;
        }
    }

    return `${prefix}-${year}-${number.toString().padStart(4, '0')}`;
};

// @desc    Create new invoice or quotation
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
    try {
        const { projectId, type } = req.body;

        if (!['Invoice', 'Quotation'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type. Must be Invoice or Quotation' });
        }

        const project = await MainProject.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check authorization
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const subProjects = await SubProject.find({ mainProject: projectId });
        const payments = await Payment.find({ mainProject: projectId });

        const documentId = await generateId(type);

        const items = subProjects.map(sp => ({
            name: sp.name,
            description: sp.description,
            amount: sp.price,
            status: sp.status
        }));

        const invoicePayments = payments.map(p => ({
            date: p.paymentDate,
            amount: p.amount,
            method: p.paymentMethod,
            reference: p.reference
        }));

        const invoice = await Invoice.create({
            project: projectId,
            type,
            documentId,
            clientDetails: {
                name: project.clientName,
                email: project.clientEmail,
                phone: project.clientPhone,
                address: '' // Add if available in project
            },
            projectDetails: {
                name: project.name,
                description: project.description,
                startDate: project.startDate
            },
            items,
            totalAmount: project.totalAmount,
            paidAmount: project.paidAmount,
            payments: invoicePayments,
            status: 'Draft'
        });

        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all invoices/quotations for a project
// @route   GET /api/projects/:projectId/invoices
// @access  Private
const getProjectInvoices = async (req, res) => {
    try {
        const project = await MainProject.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const invoices = await Invoice.find({ project: req.params.projectId }).sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single invoice/quotation
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('project');

        if (!invoice) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (invoice.project && invoice.project.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete invoice/quotation
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('project');

        if (!invoice) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Verify ownership
        if (invoice.project && invoice.project.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await invoice.deleteOne();
        res.json({ message: 'Document removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createInvoice,
    getProjectInvoices,
    getInvoice,
    deleteInvoice
};
