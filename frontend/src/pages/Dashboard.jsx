import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../utils/api';

function Dashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    description: '',
    status: 'Planning'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load projects');
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.clientEmail && project.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProjects(filtered);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await projectsAPI.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        description: '',
        status: 'Planning'
      });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Planning': 'status-planning',
      'In Progress': 'status-in-progress',
      'Completed': 'status-completed',
      'On Hold': 'status-on-hold',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-planning';
  };

  const calculateStats = () => {
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const totalRevenue = projects.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalPaid = projects.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    return { total, inProgress, completed, totalRevenue, totalPaid };
  };

  const stats = calculateStats();

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
      {/* Enhanced Header */}
      <Row className="mb-4 align-items-center">
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
              <i className="bi bi-grid-fill me-3" style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}></i>
              Project Dashboard
            </h2>
            <p className="text-white mb-0" style={{ fontSize: '1.05rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Manage all your business projects efficiently
            </p>
          </div>
        </Col>
        <Col xs="auto">
          {user.role !== 'developer' && (
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              style={{
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                background: 'white',
                color: '#667eea',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#667eea';
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Project
            </Button>
          )}
        </Col>
      </Row>

      {/* Search and Filter Section */}
      <Row className="mb-4">
        <Col md={8}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute" style={{
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: '1.2rem'
            }}></i>
            <Form.Control
              type="text"
              placeholder="Search projects by name, client, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '3rem',
                paddingRight: '1rem',
                height: '50px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                background: 'white'
              }}
            />
            {searchTerm && (
              <Button
                variant="link"
                className="position-absolute"
                style={{
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
                onClick={() => setSearchTerm('')}
              >
                <i className="bi bi-x-circle-fill"></i>
              </Button>
            )}
          </div>
        </Col>
        <Col md={4}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              background: 'white'
            }}
          >
            <option value="All">All Status</option>
            <option value="Planning">📋 Planning</option>
            <option value="In Progress">⚡ In Progress</option>
            <option value="Completed">✅ Completed</option>
            <option value="On Hold">⏸️ On Hold</option>
            <option value="Cancelled">❌ Cancelled</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Results Info */}
      {(searchTerm || statusFilter !== 'All') && (
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center gap-2">
              <Badge bg="primary" style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem'
              }}>
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
              </Badge>
              {(searchTerm || statusFilter !== 'All') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Clear filters
                </Button>
              )}
            </div>
          </Col>
        </Row>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card">
            <h3 className="stats-number">{stats.total}</h3>
            <p className="stats-label">Total Projects</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card" style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}>
            <h3 className="stats-number">{stats.inProgress}</h3>
            <p className="stats-label">In Progress</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card" style={{ background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }}>
            <h3 className="stats-number">{stats.completed}</h3>
            <p className="stats-label">Completed</p>
          </Card>
        </Col>
        {user.role !== 'developer' && (
          <Col md={3}>
            <Card className="stats-card" style={{ background: 'linear-gradient(135deg, #8e44ad 0%, #7d3c98 100%)' }}>
              <h3 className="stats-number">Rs. {stats.totalPaid.toLocaleString()}</h3>
              <p className="stats-label">Total Revenue</p>
            </Card>
          </Col>
        )}
      </Row>

      {/* Projects List */}
      <Row>
        {filteredProjects.length === 0 && projects.length > 0 ? (
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <i className="bi bi-search" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                <h4 className="mt-3">No projects found</h4>
                <p className="text-muted">Try adjusting your search or filter criteria</p>
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : filteredProjects.length === 0 ? (
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <i className="bi bi-folder-x" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                <h4 className="mt-3">No Projects Yet</h4>
                <p className="text-muted">Create your first project to get started</p>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Project
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredProjects.map((project) => (
            <Col md={6} lg={4} key={project._id}>
              <Link to={`/project/${project._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card className="project-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="mb-0">{project.name}</h5>
                      <Badge className={`status-badge ${getStatusClass(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="mb-1">
                        <i className="bi bi-person-fill text-muted me-2"></i>
                        <strong>{project.clientName}</strong>
                      </p>
                      {project.clientEmail && (
                        <p className="mb-1 text-muted small">
                          <i className="bi bi-envelope me-2"></i>
                          {project.clientEmail}
                        </p>
                      )}
                    </div>

                    {user.role !== 'developer' && (
                      <>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">Total Amount</small>
                            <h6 className="mb-0">Rs. {project.totalAmount?.toLocaleString() || 0}</h6>
                          </div>
                          <div className="text-end">
                            <small className="text-muted">Paid</small>
                            <h6 className="mb-0 text-success">Rs. {project.paidAmount?.toLocaleString() || 0}</h6>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="progress" style={{ height: '6px' }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: `${project.totalAmount > 0 ? (project.paidAmount / project.totalAmount) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">
                            {project.totalAmount > 0
                              ? `${Math.round((project.paidAmount / project.totalAmount) * 100)}% paid`
                              : 'No amount set'
                            }
                          </small>
                        </div>
                      </>
                    )}

                    {project.subProjects && project.subProjects.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted">
                          <i className="bi bi-list-check me-1"></i>
                          {project.subProjects.length} sub-project(s)
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))
        )}
      </Row>

      {/* Create Project Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Emeena Pantry Cupboard"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    placeholder="Enter client name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    placeholder="client@example.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    placeholder="+94 XXX XXX XXX"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Project description..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Initial Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create Project
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Dashboard;