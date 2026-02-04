import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, subProjectsAPI, paymentsAPI } from '../utils/api';
import logo from '../assets/logo2.png';

function Invoice({ user }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [subProjects, setSubProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      const [projectRes, subProjectsRes, paymentsRes] = await Promise.all([
        projectsAPI.getOne(id),
        subProjectsAPI.getAll(id),
        paymentsAPI.getAll(id)
      ]);
      
      setProject(projectRes.data);
      setSubProjects(subProjectsRes.data);
      setPayments(paymentsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invoice data');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Set print margins to 0.5cm via CSS
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
    
    // Clean up
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

  if (!project) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Project not found</Alert>
        <Link to="/dashboard">
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </Container>
    );
  }

  const subtotal = project.totalAmount;
  const balance = project.totalAmount - project.paidAmount;

  return (
    <Container className="py-4">
      {/* Action Buttons */}
      <Row className="mb-4 no-print">
        <Col>
          <Link to={`/project/${project._id}`} className="text-decoration-none">
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
                {/* <i className="bi bi-lightbulb-fill text-primary me-2"></i> */}
                {/* ideasmart Solutions */}
                <img src={logo} alt="Logo" style={{ height: '80px', margin: '0 7px 3px 0' }} />
              </h1>
              <p className="mb-1"><strong>Giving smart solutions for your business</strong></p>
              <p className="text-muted small mb-1">Email: info@ideasmartsolutions.com</p>
              <p className="text-muted small mb-0">Phone: +94 XXX XXX XXX</p>
            </Col>
            <Col md={6} className="text-md-end">
              <h2 className="text-primary mb-3">INVOICE</h2>
              <p className="mb-1"><strong>Invoice Date:</strong> {formatDate(new Date())}</p>
              <p className="mb-1"><strong>Project Start:</strong> {formatDate(project.startDate)}</p>
              <p className="mb-0"><strong>Status:</strong> <span className="badge bg-primary">{project.status}</span></p>
            </Col>
          </Row>
        </div>

        {/* Bill To Section */}
        <Row className="mb-4">
          <Col md={6}>
            <h5 className="mb-3">Bill To:</h5>
            <p className="mb-1"><strong>{project.clientName}</strong></p>
            {project.clientEmail && <p className="mb-1">{project.clientEmail}</p>}
            {project.clientPhone && <p className="mb-0">{project.clientPhone}</p>}
          </Col>
          <Col md={6} className="text-md-end">
            <h5 className="mb-3">Project Details:</h5>
            <p className="mb-1"><strong>Project Name:</strong> {project.name}</p>
            {project.description && <p className="mb-0 text-muted small">{project.description}</p>}
          </Col>
        </Row>

        {/* Sub-Projects Table */}
        <div className="mb-4">
          <h5 className="mb-3">Project Breakdown</h5>
          <Table className="invoice-table" bordered hover>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '40%' }}>Description</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '20%' }}>Deadline</th>
                <th style={{ width: '20%' }} className="text-end">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {subProjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No sub-projects added yet
                  </td>
                </tr>
              ) : (
                subProjects.map((subProject, index) => (
                  <tr key={subProject._id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{subProject.name}</strong>
                      {subProject.description && (
                        <div className="text-muted small">{subProject.description}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        subProject.status === 'Completed' ? 'bg-success' :
                        subProject.status === 'In Progress' ? 'bg-warning' :
                        subProject.status === 'Not Started' ? 'bg-secondary' :
                        'bg-danger'
                      }`}>
                        {subProject.status}
                      </span>
                    </td>
                    <td>{formatDate(subProject.deadline)}</td>
                    <td className="text-end">{subProject.price.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan="4" className="text-end">Subtotal:</th>
                <th className="text-end">Rs. {subtotal.toLocaleString()}</th>
              </tr>
            </tfoot>
          </Table>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
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
                {payments.map((payment, index) => (
                  <tr key={payment._id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{payment.reference || '-'}</td>
                    <td className="text-end text-success">{payment.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="4" className="text-end">Total Paid:</th>
                  <th className="text-end text-success">Rs. {project.paidAmount.toLocaleString()}</th>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}

        {/* Summary */}
        <Row>
          <Col md={{ span: 6, offset: 6 }}>
            <Table className="mb-0">
              <tbody>
                <tr>
                  <td className="text-end"><strong>Total Amount:</strong></td>
                  <td className="text-end" style={{ width: '40%' }}>
                    <strong>Rs. {subtotal.toLocaleString()}</strong>
                  </td>
                </tr>
                <tr className="table-success">
                  <td className="text-end"><strong>Paid to Date:</strong></td>
                  <td className="text-end">
                    <strong>Rs. {project.paidAmount.toLocaleString()}</strong>
                  </td>
                </tr>
                <tr className={balance > 0 ? 'table-warning' : 'table-success'}>
                  <td className="text-end"><strong>Balance Due:</strong></td>
                  <td className="text-end">
                    <strong>Rs. {balance.toLocaleString()}</strong>
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
                Payment is due within 30 days of invoice date.<br />
                Late payments may incur additional charges.<br />
                Please quote invoice number with payment.
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

export default Invoice;