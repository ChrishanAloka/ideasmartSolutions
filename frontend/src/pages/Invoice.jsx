import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Alert, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { invoicesAPI } from '../utils/api';
import logo from '../assets/logo2.png';

function Invoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      const response = await invoicesAPI.getOne(id);
      setInvoice(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invoice data');
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
        body { margin: 0; padding: 0; background: white !important; }
        .no-print, .btn, .alert, .navbar, .container-fluid > .row:first-child { display: none !important; }
        .container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
        .invoice-container { 
          position: static !important;
          width: 100% !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          visibility: visible !important;
        }
        .invoice-container * { visibility: visible !important; }
        .invoice-table { width: 100% !important; border-collapse: collapse !important; }
        .invoice-table th, .invoice-table td { border: 1px solid #dee2e6 !important; padding: 4px 8px !important; font-size: 0.85rem !important; }
        .invoice-header { height: auto !important; max-height: 25% !important; overflow: hidden !important; margin-bottom: 0 !important; }
        .invoice-header h1 { margin-bottom: 0.5rem !important; }
        .invoice-header h1 img { height: 60px !important; }
        tr { page-break-inside: avoid !important; }
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
        .row { display: flex !important; flex-wrap: wrap !important; margin-top: 0 !important; margin-bottom: 0 !important; }
        .col-md-6 { width: 50% !important; }
        .text-md-end { text-align: right !important; }
        .badge { border: 1px solid #000 !important; color: #000 !important; background: transparent !important; padding: 2px 4px !important; }
        .mt-5 { margin-top: 1rem !important; }
        .summary-table, .invoice-footer { page-break-inside: avoid !important; }
        .summary-table td { padding: 2px 8px !important; font-size: 0.85rem !important; line-height: 1 !important; }
        .bill-to-section { margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; font-size: 1rem !important; }
        .bill-to-section h5 { margin-bottom: 0.1rem !important; margin-top: 0 !important; font-size: 1rem !important; }
        .bill-to-section p { margin-bottom: 0.05rem !important; }
        .invoice-footer .row { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: flex-start !important; }
        .invoice-footer .col-md-4 { width: 35% !important; flex: 0 0 35% !important; margin-right: 2% !important; }
        .invoice-footer .col-md-8 { width: 63% !important; flex: 0 0 63% !important; }
        .invoice-footer h6 { font-size: 0.9rem !important; margin-bottom: 0.2rem !important; }
        .invoice-footer p, .invoice-footer ul, .invoice-footer li { font-size: 0.75rem !important; line-height: 1.2 !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
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
        <Link to="/dashboard">
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </Container>
    );
  }

  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <Container className="py-4">
      {/* Action Buttons */}
      <Row className="mb-4 no-print">
        <Col>
          <Link to={`/project/${invoice.project ? invoice.project._id : ''}`} className="text-decoration-none">
            <Button variant="outline-secondary" className="me-2">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Project
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
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Invoice Document */}
      <div className="invoice-container">
        {/* Header */}
        <div className="invoice-header">
          <Row>
            <Col md={6}>
              <h1 className="mb-3">
                <img src={logo} alt="Logo" style={{ height: '80px', margin: '0 7px 3px 0' }} />
              </h1>
              <p className="mb-1"><strong>Smart Solutions for Smart Businesses</strong></p>
              <p className="text-muted small mb-1">Email: info@ideasmartsolutions.com</p>
              <p className="text-muted small mb-0">Phone: (+94)76 811 9 360 / (+94)33 220 9 360</p>
            </Col>
            <Col md={6} className="text-md-end">
              <h2 className="text-primary mb-3">INVOICE</h2>
              <p className="mb-1"><strong>Invoice No:</strong> {invoice.documentId}</p>
              <p className="mb-1"><strong>Date:</strong> {formatDate(invoice.createdAt)}</p>
              <p className="mb-0"><strong>Status:</strong> <Badge bg={invoice.status === 'Paid' ? 'success' : 'warning'}>{invoice.status}</Badge></p>
            </Col>
          </Row>
        </div>

        {/* Bill To Section */}
        <Row className="mb-4 mt-4 bill-to-section">
          <Col md={6}>
            <h5 className="mb-3">Bill To:</h5>
            <p className="mb-1"><strong>{invoice.clientDetails.name}</strong></p>
            {invoice.clientDetails.email && <p className="mb-1">{invoice.clientDetails.email}</p>}
            {invoice.clientDetails.phone && <p className="mb-0">{invoice.clientDetails.phone}</p>}
          </Col>
          <Col md={6} className="text-md-end">
            <h5 className="mb-3">Project Details:</h5>
            <p className="mb-1"><strong>{invoice.projectDetails.name}</strong></p>
            {invoice.projectDetails.description && (
              <p className="mb-0 text-muted small">{invoice.projectDetails.description}</p>
            )}
          </Col>
        </Row>

        {/* Items Table */}
        <div className="mb-4">
          <h5 className="mb-3">Project Breakdown</h5>
          <Table className="invoice-table" bordered hover>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '75%' }}>Description</th>
                <th style={{ width: '20%' }} className="text-end">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="fw-bold">{item.name || item.description}</div>
                    {item.name && item.description && (
                      <div className="text-muted small mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </div>
                    )}
                    {item.features && item.features.length > 0 && (
                      <ul className="small text-muted mb-0 mt-2 ps-3">
                        {item.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="text-end">{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan="2" className="text-end">Subtotal:</th>
                <th className="text-end">Rs. {invoice.totalAmount.toLocaleString()}</th>
              </tr>
            </tfoot>
          </Table>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-4">
            <h5 className="mb-3">Payment History</h5>
            <Table className="invoice-table" bordered hover>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '25%' }}>Date</th>
                  <th style={{ width: '25%' }}>Method</th>
                  <th style={{ width: '25%' }}>Reference</th>
                  <th style={{ width: '20%' }} className="text-end">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{formatDate(payment.date)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.reference || '-'}</td>
                    <td className="text-end text-success text-bold"><strong>{payment.amount.toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="4" className="text-end">Total Paid:</th>
                  <th className="text-end text-success">Rs. {invoice.paidAmount.toLocaleString()}</th>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}

        {/* Summary */}
        <Row className="summary-table">
          <Col md={12}>
            <Table className="mb-0">
              <tbody>
                <tr>
                  <td className="text-start"><strong>Total Amount:</strong></td>
                  <td className="text-end" style={{ width: '40%' }}>
                    <strong>Rs. {invoice.totalAmount.toLocaleString()}</strong>
                  </td>
                </tr>
                <tr className="table-success">
                  <td className="text-start"><strong>Paid to Date:</strong></td>
                  <td className="text-end">
                    <strong>Rs. {invoice.paidAmount.toLocaleString()}</strong>
                  </td>
                </tr>
                <tr className={balance > 0 ? 'table-warning' : 'table-success'}>
                  <td className="text-start"><strong>Balance Due:</strong></td>
                  <td className="text-end">
                    <strong>Rs. {balance.toLocaleString()}</strong>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Footer */}
        <div className="mt-5 pt-4 border-top invoice-footer">
          <div className="invoice-footer">
            <Row>
              <Col md={12} className="text-md-start">
                <h6>Terms & Conditions:</h6>
                <p className="small text-muted mb-1">
                  60% of the grand total must be paid as the advance payment. Email us the Online Bank Transfer receipt via <a href="mailto:solutions@ideasmart.lk">solutions@ideasmart.lk</a> or WhatsApp on 076 811 9 360<br />
                  Balance payment must be paid on the completion day of the project.<br />
                  All the relevant documents, payment receipts, Logins and Passwords will be handed over to
                  the customer upon the completion of the project. Customer is requested to keep that “Project File” safe.<br />
                  If lost, there will be a charge to issue any documents of the “Project File”.
                </p>
              </Col>
            </Row>
          </div>
          <div className="mt-4 pt-3 border-top invoice-footer">
            <Row>
              <Col md={12}>
                <h6>Payment Information:</h6>
                <p className="small text-muted mb-1">
                  Bank: Hatton National Bank<br />
                  Account Name: IDEASMART<br />
                  Account Number: 1300 2008 6965<br />
                  Branch: Weliweriya
                </p>
              </Col>
            </Row>
          </div>
          {/* Our Services Section */}
          <div className="mt-4 pt-3 border-top invoice-footer">
            <h6 className="mb-3 text-primary fw-bold">Our Professional Services</h6>

            <Row>
              <Col md={6}>
                <ul className="small text-muted mb-2">
                  <li>Custom Web Systems Development</li>
                  <li>Business & Corporate Websites</li>
                  <li>Startup Branding & Identity Design</li>
                  <li>Google Maps Business Listing</li>
                </ul>
              </Col>

              <Col md={6}>
                <ul className="small text-muted mb-2">
                  <li>Social Media Presence Development</li>
                  <li>Digital Marketing & Promotions</li>
                  <li>Technology Consultation & Business Upgrading</li>
                  <li>Business Rebranding & Market Expansion Strategies</li>
                </ul>
              </Col>
            </Row>

            <p className="small text-muted mt-2 mb-0">
              We design, develop and customize web systems according to customer requirements.
              We help newly started businesses establish their presence, upgrade with modern technology,
              and rebrand themselves to capture more customers and expand their market reach.
            </p>
          </div>

          {/* Thank You */}
          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              Thank you for choosing ideaSmart Solutions!
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default Invoice;