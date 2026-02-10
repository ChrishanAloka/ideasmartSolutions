import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { projectsAPI, subProjectsAPI, subscriptionInvoicesAPI } from '../utils/api';

function Subscriptions({ user }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject !== 'All') {
      loadProjectSubscriptions();
    }
  }, [selectedProject]);

  const fetchData = async () => {
    try {
      const projectsRes = await projectsAPI.getAll();
      setProjects(projectsRes.data);

      // Load all subscriptions
      await loadAllSubscriptions(projectsRes.data);

      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const loadAllSubscriptions = async (projectsList) => {
    try {
      let allSubs = [];

      for (const project of projectsList) {
        const subProjectsRes = await subProjectsAPI.getAll(project._id);
        const subscriptionSubs = subProjectsRes.data.filter(sp => sp.isSubscription);

        allSubs = [...allSubs, ...subscriptionSubs.map(sub => ({
          ...sub,
          projectName: project.name,
          projectId: project._id
        }))];
      }

      setSubscriptions(allSubs);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  };

  const loadProjectSubscriptions = async () => {
    if (selectedProject === 'All') return;

    try {
      const invoicesRes = await subscriptionInvoicesAPI.getAllForProject(selectedProject);
      setInvoices(invoicesRes.data);
    } catch (err) {
      setError('Failed to load invoices');
    }
  };

  const handleGenerateInvoice = async (subProjectId) => {
    try {
      setError('');
      setSuccess('');
      await subscriptionInvoicesAPI.generateNext(subProjectId);
      setSuccess('Invoice generated successfully!');
      loadProjectSubscriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      setError('');
      setSuccess('');
      await subscriptionInvoicesAPI.update(invoiceId, {
        status: 'Paid',
        paidDate: new Date()
      });
      setSuccess('Invoice marked as paid!');
      loadProjectSubscriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update invoice');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'warning',
      'Paid': 'success',
      'Overdue': 'danger',
      'Cancelled': 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNextBillingDate = (subscription) => {
    if (!subscription.nextBillingDate) {
      if (!subscription.subscriptionStartDate) return 'Not set';

      const nextDate = new Date(subscription.subscriptionStartDate);
      if (subscription.subscriptionType === 'Monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (subscription.subscriptionType === 'Yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      return formatDate(nextDate);
    }
    return formatDate(subscription.nextBillingDate);
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

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <h2 style={{
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem'
            }}>
              <i className="bi bi-arrow-repeat me-3" style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}></i>
              Subscription Management
            </h2>
            <p className="text-white mb-0" style={{ fontSize: '1.05rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Track recurring services and manage subscription invoices
            </p>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
            <h3 className="mb-0">{subscriptions.length}</h3>
            <small>Active Subscriptions</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
            <h3 className="mb-0">
              {subscriptions.filter(s => s.subscriptionType === 'Monthly').length}
            </h3>
            <small>Monthly</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' }}>
            <h3 className="mb-0">
              {subscriptions.filter(s => s.subscriptionType === 'Yearly').length}
            </h3>
            <small>Yearly</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
            <h3 className="mb-0">
              Rs. {subscriptions.reduce((sum, s) => sum + s.price, 0).toLocaleString()}
            </h3>
            <small>Annual Revenue</small>
          </Card>
        </Col>
      </Row>

      {/* Active Subscriptions */}
      <Card className="mb-4">
        <Card.Header style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}>
          <h5 className="mb-0">
            <i className="bi bi-calendar-check me-2"></i>
            Active Subscriptions
          </h5>
        </Card.Header>
        <Card.Body>
          {subscriptions.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <h4 className="mt-3">No Active Subscriptions</h4>
              <p className="text-muted">Create subscription-based sub-projects to track recurring services</p>
              <Link to="/dashboard">
                <Button variant="primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Go to Projects
                </Button>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Next Billing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(subscription => (
                    <tr key={subscription._id}>
                      <td>
                        <strong>{subscription.name}</strong>
                        {subscription.description && (
                          <div className="text-muted small">{subscription.description}</div>
                        )}
                      </td>
                      <td>
                        <Link to={`/project/${subscription.projectId}`} style={{ textDecoration: 'none' }}>
                          <i className="bi bi-folder me-1"></i>
                          {subscription.projectName}
                        </Link>
                      </td>
                      <td>
                        <Badge bg={subscription.subscriptionType === 'Monthly' ? 'success' : 'primary'}>
                          {subscription.subscriptionType === 'Monthly' ? '📅 Monthly' : '📆 Yearly'}
                        </Badge>
                      </td>
                      <td>
                        <strong>Rs. {subscription.price.toLocaleString()}</strong>
                        <div className="text-muted small">
                          per {subscription.subscriptionType.toLowerCase()}
                        </div>
                      </td>
                      <td>{getNextBillingDate(subscription)}</td>
                      <td>
                        <Badge bg={subscription.status === 'Completed' ? 'success' : 'info'}>
                          {subscription.status === 'Completed' ? 'Active' : subscription.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleGenerateInvoice(subscription._id)}
                        >
                          <i className="bi bi-file-earmark-plus me-1"></i>
                          Generate Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Invoice History */}
      <Card>
        <Card.Header style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}>
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">
                <i className="bi bi-receipt me-2"></i>
                Subscription Invoices
              </h5>
            </Col>
            <Col xs="auto">
              <Form.Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="All">All Projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {selectedProject === 'All' ? (
            <div className="text-center py-5">
              <i className="bi bi-funnel" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <h5 className="mt-3">Select a Project</h5>
              <p className="text-muted">Choose a project from the dropdown to view its subscription invoices</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <h5 className="mt-3">No Invoices Yet</h5>
              <p className="text-muted">Generate invoices for the subscription services in this project</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Service</th>
                    <th>Billing Period</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td><strong>{invoice.invoiceNumber}</strong></td>
                      <td>{invoice.subProject?.name || 'N/A'}</td>
                      <td>
                        {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
                      </td>
                      <td><strong>Rs. {invoice.amount.toLocaleString()}</strong></td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td>
                        <Badge bg={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {invoice.status === 'Pending' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleMarkPaid(invoice._id)}
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              Mark Paid
                            </Button>
                          )}
                          <Link to={`/subscription-invoice/${invoice._id}`}>
                            <Button variant="outline-primary" size="sm">
                              <i className="bi bi-eye me-1"></i>
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Subscriptions;