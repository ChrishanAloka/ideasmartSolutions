import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { subscriptionInvoicesAPI } from '../utils/api';

function SubscriptionInvoice({ user }) {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await subscriptionInvoicesAPI.getOne(id);
      setInvoice(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invoice');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @page { 
        margin: 0.5cm; 
        size: A4 portrait;
      }
      @media print {
        body { 
          margin: 0; 
          padding: 0;
        }
        body * {
          visibility: hidden;
        }
        .invoice-container,
        .invoice-container * {
          visibility: visible;
        }
        .invoice-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Invoice not found</Alert>
        <Link to="/subscriptions">
          <Button variant="primary">Back to Subscriptions</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Action Buttons */}
      <Row className="mb-4 no-print">
        <Col>
          <Link to="/subscriptions" className="text-decoration-none">
            <Button variant="outline-secondary" className="me-2">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Subscriptions
            </Button>
          </Link>
          <Button 
            variant="primary" 
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            <i className="bi bi-printer me-2"></i>
            Print Invoice
          </Button>
          <small className="ms-3 text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            <i className="bi bi-info-circle me-1"></i>
            Tip: Use "Save as PDF" in print dialog to save digitally
          </small>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Invoice */}
      <div className="invoice-container">
        {/* Header */}
        <div className="invoice-header">
          <Row>
            <Col md={6}>
              <h1 className="mb-3">
                <i className="bi bi-lightbulb-fill text-primary me-2"></i>
                IdeaSmart Solutions
              </h1>
              <p className="mb-1"><strong>Giving smart solutions for your business</strong></p>
              <p className="text-muted small mb-1">Email: info@ideasmartsolutions.com</p>
              <p className="text-muted small mb-0">Phone: +94 XXX XXX XXX</p>
            </Col>
            <Col md={6} className="text-md-end">
              <h2 className="text-primary mb-3">SUBSCRIPTION INVOICE</h2>
              <p className="mb-1"><strong>Invoice Number:</strong> {invoice.invoiceNumber}</p>
              <p className="mb-1"><strong>Invoice Date:</strong> {formatDate(invoice.createdAt)}</p>
              <p className="mb-1"><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
              <p className="mb-0">
                <strong>Status:</strong>{' '}
                <span className={`badge ${
                  invoice.status === 'Paid' ? 'bg-success' :
                  invoice.status === 'Pending' ? 'bg-warning' :
                  'bg-danger'
                }`}>
                  {invoice.status}
                </span>
              </p>
            </Col>
          </Row>
        </div>

        {/* Bill To Section */}
        <Row className="mb-4">
          <Col md={6}>
            <h5 className="mb-3">Bill To:</h5>
            <p className="mb-1"><strong>{invoice.mainProject.clientName}</strong></p>
            {invoice.mainProject.clientEmail && <p className="mb-1">{invoice.mainProject.clientEmail}</p>}
            {invoice.mainProject.clientPhone && <p className="mb-0">{invoice.mainProject.clientPhone}</p>}
          </Col>
          <Col md={6} className="text-md-end">
            <h5 className="mb-3">Project:</h5>
            <p className="mb-1"><strong>{invoice.mainProject.name}</strong></p>
            <p className="mb-0 text-muted small">Main Project Reference</p>
          </Col>
        </Row>

        {/* Billing Period */}
        <div className="alert alert-info mb-4">
          <Row>
            <Col md={6}>
              <strong>Billing Period:</strong><br />
              {formatDate(invoice.billingPeriodStart)} to {formatDate(invoice.billingPeriodEnd)}
            </Col>
            <Col md={6} className="text-md-end">
              <strong>Subscription Type:</strong><br />
              {invoice.subProject.subscriptionType === 'Monthly' ? '📅 Monthly Subscription' : '📆 Yearly Subscription'}
            </Col>
          </Row>
        </div>

        {/* Service Details */}
        <div className="mb-4">
          <h5 className="mb-3">Service Details</h5>
          <Table className="invoice-table" bordered>
            <thead>
              <tr>
                <th style={{ width: '60%' }}>Description</th>
                <th style={{ width: '20%' }}>Type</th>
                <th style={{ width: '20%' }} className="text-end">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{invoice.subProject.name}</strong>
                  <div className="text-muted small">
                    Recurring {invoice.subProject.subscriptionType.toLowerCase()} service charge
                  </div>
                </td>
                <td>{invoice.subProject.subscriptionType}</td>
                <td className="text-end"><strong>{invoice.amount.toLocaleString()}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th colSpan="2" className="text-end">Total Amount:</th>
                <th className="text-end">Rs. {invoice.amount.toLocaleString()}</th>
              </tr>
            </tfoot>
          </Table>
        </div>

        {/* Payment Status */}
        {invoice.status === 'Paid' && invoice.paidDate && (
          <div className="alert alert-success mb-4">
            <Row>
              <Col md={6}>
                <i className="bi bi-check-circle me-2"></i>
                <strong>Payment Received</strong>
              </Col>
              <Col md={6} className="text-md-end">
                Paid on: {formatDate(invoice.paidDate)}
              </Col>
            </Row>
          </div>
        )}

        {invoice.status === 'Pending' && (
          <div className="alert alert-warning mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Payment Pending</strong> - Please make payment by {formatDate(invoice.dueDate)}
          </div>
        )}

        {/* Summary */}
        <Row className="mb-4">
          <Col md={{ span: 6, offset: 6 }}>
            <Table className="mb-0">
              <tbody>
                <tr className="table-light">
                  <td className="text-end"><strong>Subtotal:</strong></td>
                  <td className="text-end" style={{ width: '40%' }}>
                    Rs. {invoice.amount.toLocaleString()}
                  </td>
                </tr>
                <tr className="table-light">
                  <td className="text-end"><strong>Tax (0%):</strong></td>
                  <td className="text-end">Rs. 0.00</td>
                </tr>
                <tr className="table-primary">
                  <td className="text-end"><strong>Total Due:</strong></td>
                  <td className="text-end">
                    <strong style={{ fontSize: '1.2rem' }}>Rs. {invoice.amount.toLocaleString()}</strong>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Footer */}
        <div className="mt-5 pt-4 border-top">
          <Row>
            <Col md={6}>
              <h6>Payment Information:</h6>
              <p className="small text-muted mb-1">
                Bank: Commercial Bank<br />
                Account Name: IdeaSmart Solutions<br />
                Account Number: XXXX XXXX XXXX<br />
                Branch: Ratnapura
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <h6>Terms & Conditions:</h6>
              <p className="small text-muted mb-1">
                This is a recurring subscription charge.<br />
                Payment is due within 7 days of invoice date.<br />
                Service continues until subscription is cancelled.
              </p>
            </Col>
          </Row>
          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              Thank you for choosing IdeaSmart Solutions!
            </p>
            <p className="text-muted small mb-0">
              For any queries, please contact us at info@ideasmartsolutions.com
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default SubscriptionInvoice;