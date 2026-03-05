import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Tab, Tabs, Table, ProgressBar } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, subProjectsAPI, paymentsAPI, invoicesAPI, tasksAPI, authAPI } from '../utils/api';

function ProjectDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [subProjects, setSubProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubProjectModal, setShowSubProjectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit states
  const [editingSubProject, setEditingSubProject] = useState(null);

  // Form data
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    description: '',
    status: 'Planning'
  });

  const [subProjectFormData, setSubProjectFormData] = useState({
    name: '',
    description: '',
    price: 0,
    deadline: '',
    status: 'Not Started',
    notes: '',
    isSubscription: false,
    subscriptionType: 'None',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    features: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    reference: '',
    notes: ''
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    progress: 0,
    assignedTo: '',
    deadline: '',
    subProject: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError('');

      // First, get the main project
      const projectRes = await projectsAPI.getOne(id);
      setProject(projectRes.data);

      setProjectFormData({
        name: projectRes.data.name,
        clientName: projectRes.data.clientName,
        clientEmail: projectRes.data.clientEmail || '',
        clientPhone: projectRes.data.clientPhone || '',
        description: projectRes.data.description || '',
        status: projectRes.data.status
      });

      // Then fetch other details semi-independently
      try {
        const [subProjectsRes, paymentsRes, invoicesRes, tasksRes, usersRes] = await Promise.all([
          subProjectsAPI.getAll(id),
          paymentsAPI.getAll(id),
          invoicesAPI.getAllForProject(id),
          tasksAPI.getAll({ projectId: id }),
          authAPI.getUsers()
        ]);

        setSubProjects(subProjectsRes.data);
        setPayments(paymentsRes.data);
        setInvoices(invoicesRes.data);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
      } catch (secondaryErr) {
        console.error('Error fetching secondary project data:', secondaryErr);
        // We don't fail the whole page if secondary data fails, but we might want to alert the user
        setError('Some project details could not be loaded, but the main project is visible.');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.response?.data?.message || 'Failed to load project details');
      setLoading(false);
    }
  };

  const handleTaskProgressChange = (value) => {
    const progress = parseInt(value);
    let status = taskFormData.status;

    if (progress === 100) {
      status = 'Completed';
    } else if (progress > 0) {
      status = 'In Progress';
    }

    setTaskFormData({ ...taskFormData, progress, status });
  };

  const handleProjectUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await projectsAPI.update(id, projectFormData);
      setShowEditModal(false);
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleProjectDelete = async () => {
    try {
      await projectsAPI.delete(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleSubProjectSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSubProject) {
        await subProjectsAPI.update(editingSubProject._id, {
          ...subProjectFormData,
          features: subProjectFormData.features.split('\n').filter(f => f.trim())
        });
      } else {
        await subProjectsAPI.create(id, {
          ...subProjectFormData,
          features: subProjectFormData.features.split('\n').filter(f => f.trim())
        });
      }

      setShowSubProjectModal(false);
      setEditingSubProject(null);
      setSubProjectFormData({
        name: '',
        description: '',
        price: 0,
        deadline: '',
        status: 'Not Started',
        notes: '',
        isSubscription: false,
        subscriptionType: 'None',
        subscriptionStartDate: '',
        subscriptionEndDate: '',
        features: ''
      });
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sub-project');
    }
  };

  const handleSubProjectDelete = async (subProjectId) => {
    if (window.confirm('Are you sure you want to delete this sub-project?')) {
      try {
        await subProjectsAPI.delete(subProjectId);
        fetchProjectData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete sub-project');
      }
    }
  };

  const handleEditSubProject = (subProject) => {
    setEditingSubProject(subProject);
    setSubProjectFormData({
      name: subProject.name,
      description: subProject.description || '',
      price: subProject.price,
      deadline: new Date(subProject.deadline).toISOString().split('T')[0],
      status: subProject.status,
      notes: subProject.notes || '',
      isSubscription: subProject.isSubscription || false,
      subscriptionType: subProject.subscriptionType || 'None',
      subscriptionStartDate: subProject.subscriptionStartDate ? new Date(subProject.subscriptionStartDate).toISOString().split('T')[0] : '',
      subscriptionEndDate: subProject.subscriptionEndDate ? new Date(subProject.subscriptionEndDate).toISOString().split('T')[0] : '',
      features: subProject.features ? subProject.features.join('\n') : ''
    });
    setShowSubProjectModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await paymentsAPI.create(id, paymentFormData);
      setShowPaymentModal(false);
      setPaymentFormData({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        reference: '',
        notes: ''
      });
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment');
    }
  };

  const handlePaymentDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsAPI.delete(paymentId);
        fetchProjectData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete payment');
      }
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const taskData = {
        ...taskFormData,
        mainProject: id
      };

      if (editingTask) {
        await tasksAPI.update(editingTask._id, taskData);
      } else {
        await tasksAPI.create(taskData);
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setTaskFormData({
        title: '',
        description: '',
        status: 'To Do',
        priority: 'Medium',
        progress: 0,
        assignedTo: '',
        deadline: '',
        subProject: '',
        notes: ''
      });
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        fetchProjectData();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleAddTaskForSubProject = (subProjectId) => {
    setEditingTask(null);
    setTaskFormData({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      progress: 0,
      assignedTo: '',
      deadline: '',
      subProject: subProjectId,
      notes: ''
    });
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      subProject: task.subProject?._id || task.subProject || '',
      notes: task.notes || ''
    });
    setShowTaskModal(true);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Planning': 'status-planning',
      'In Progress': 'status-in-progress',
      'Completed': 'status-completed',
      'On Hold': 'status-on-hold',
      'Cancelled': 'status-cancelled',
      'Not Started': 'status-not-started'
    };
    return statusMap[status] || 'status-planning';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleGenerateInvoice = async () => {
    try {
      if (!window.confirm('Generate a new invoice based on current project status?')) return;
      const response = await invoicesAPI.create(id, 'Invoice');
      navigate(`/invoice/${response.data._id}`);
    } catch (err) {
      setError('Failed to generate invoice');
    }
  };

  const handleGenerateQuotation = async () => {
    try {
      if (!window.confirm('Generate a new quotation based on current project status?')) return;
      const response = await invoicesAPI.create(id, 'Quotation');
      navigate(`/quotation/${response.data._id}`);
    } catch (err) {
      setError('Failed to generate quotation');
    }
  };

  const handleGenerateProposal = async () => {
    try {
      if (!window.confirm('Generate a new proposal based on current project status?')) return;
      const response = await invoicesAPI.create(id, 'Proposal');
      navigate(`/proposal/${response.data._id}`);
    } catch (err) {
      setError('Failed to generate proposal');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
      await invoicesAPI.delete(invoiceId);
      // Refresh invoices list
      const response = await invoicesAPI.getAllForProject(id);
      setInvoices(response.data);
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
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
        {error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <Alert variant="danger">Project not found</Alert>
        )}
        <Link to="/dashboard">
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </Container>
    );
  }

  const balance = project.totalAmount - project.paidAmount;
  const paymentProgress = project.totalAmount > 0 ? (project.paidAmount / project.totalAmount) * 100 : 0;

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Link to="/dashboard" className="text-decoration-none text-muted d-inline-block mb-2">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2>{project.name}</h2>
              <p className="text-muted mb-2">
                <i className="bi bi-person-fill me-2"></i>
                {project.clientName}
              </p>
              <Badge className={`status-badge ${getStatusClass(project.status)}`}>
                {project.status}
              </Badge>
            </div>
            {user.role !== 'developer' && (
              <div className="d-flex gap-2">
                <Button variant="outline-primary" onClick={() => setShowEditModal(true)}>
                  <i className="bi bi-pencil me-2"></i>
                  Edit Project
                </Button>
                <Button variant="outline-info" onClick={handleGenerateProposal}>
                  <i className="bi bi-file-earmark-diff me-2"></i>
                  Generate Proposal
                </Button>
                <Button variant="success" onClick={handleGenerateInvoice}>
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Generate Invoice
                </Button>
                <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>
                  <i className="bi bi-trash"></i>
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Project Summary Cards */}
      {user.role !== 'developer' && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center p-3">
              <h6 className="text-muted mb-1">Total Amount</h6>
              <h4 className="mb-0">Rs. {(project.totalAmount || 0).toLocaleString()}</h4>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center p-3 bg-success text-white">
              <h6 className="mb-1" style={{ opacity: 0.9 }}>Paid Amount</h6>
              <h4 className="mb-0">Rs. {(project.paidAmount || 0).toLocaleString()}</h4>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center p-3 bg-warning text-white">
              <h6 className="mb-1" style={{ opacity: 0.9 }}>Balance</h6>
              <h4 className="mb-0">Rs. {(balance || 0).toLocaleString()}</h4>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center p-3">
              <h6 className="text-muted mb-1">Sub-Projects</h6>
              <h4 className="mb-0">{subProjects.length}</h4>
            </Card>
          </Col>
        </Row>
      )}

      {/* Payment Progress */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="mb-3">Payment Progress</h6>
          <div className="progress" style={{ height: '25px' }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${paymentProgress}%` }}
            >
              {Math.round(paymentProgress)}%
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Tabs for Sub-Projects, Tasks and Payments */}
      <Tabs defaultActiveKey="subprojects" className="mb-3">
        <Tab eventKey="subprojects" title={`Sub-Projects (${subProjects.length})`}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Sub-Projects</h5>
                {user.role !== 'developer' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingSubProject(null);
                      setSubProjectFormData({
                        name: '',
                        description: '',
                        price: 0,
                        deadline: '',
                        status: 'Not Started',
                        notes: '',
                        isSubscription: false,
                        subscriptionType: 'None',
                        subscriptionStartDate: '',
                        subscriptionEndDate: '',
                        features: ''
                      });
                      setShowSubProjectModal(true);
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Sub-Project
                  </Button>
                )}
              </div>

              {subProjects.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-list-ul" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">No sub-projects yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Name</th>
                        {user.role !== 'developer' && <th>Price</th>}
                        <th>Deadline</th>
                        <th>Status</th>
                        {user.role !== 'developer' && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {subProjects.map((subProject) => (
                        <tr key={subProject._id}>
                          <td>
                            <strong>{subProject.name}</strong>
                            {subProject.description && (
                              <div className="text-muted small">{subProject.description}</div>
                            )}
                            {subProject.features && subProject.features.length > 0 && (
                              <ul className="small text-primary mb-0 mt-1 ps-3">
                                {subProject.features.map((f, i) => <li key={i}>{f}</li>)}
                              </ul>
                            )}
                          </td>
                          {user.role !== 'developer' && <td>Rs. {subProject.price.toLocaleString()}</td>}
                          <td>
                            {formatDate(subProject.deadline)}
                            {new Date(subProject.deadline) < new Date() && subProject.status !== 'Completed' && (
                              <Badge bg="danger" className="ms-2">Overdue</Badge>
                            )}
                          </td>
                          <td>
                            <Badge className={`status-badge ${getStatusClass(subProject.status)}`}>
                              {subProject.status}
                            </Badge>

                            {/* Tasks summary for this sub-project */}
                            {tasks.filter(t => (t.subProject?._id || t.subProject) === subProject._id).length > 0 && (
                              <div className="mt-2 small">
                                <span className="text-muted">
                                  Tasks: {tasks.filter(t => (t.subProject?._id || t.subProject) === subProject._id && t.status === 'Completed').length}/{tasks.filter(t => (t.subProject?._id || t.subProject) === subProject._id).length}
                                </span>
                                <div className="progress mt-1" style={{ height: '4px', width: '60px' }}>
                                  <div
                                    className="progress-bar bg-success"
                                    style={{
                                      width: `${(tasks.filter(t => (t.subProject?._id || t.subProject) === subProject._id && t.status === 'Completed').length / tasks.filter(t => (t.subProject?._id || t.subProject) === subProject._id).length) * 100}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </td>
                          {user.role !== 'developer' && (
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  title="Add Task"
                                  onClick={() => handleAddTaskForSubProject(subProject._id)}
                                >
                                  <i className="bi bi-check2-square"></i>
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditSubProject(subProject)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleSubProjectDelete(subProject._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {subProjects.some(sp => tasks.some(t => (t.subProject?._id || t.subProject) === sp._id)) && (
                        <tr>
                          <td colSpan="5" className="p-0">
                            <div className="p-3 bg-light">
                              <h6 className="mb-3">Sub-Project Tasks</h6>
                              <div className="d-flex flex-wrap gap-3">
                                {subProjects.map(sp => (
                                  tasks.filter(t => (t.subProject?._id || t.subProject) === sp._id).length > 0 && (
                                    <Card key={sp._id} className="shadow-sm" style={{ minWidth: '250px' }}>
                                      <Card.Header className="py-2 bg-white d-flex justify-content-between align-items-center">
                                        <span className="fw-bold small">{sp.name}</span>
                                        <Badge bg="info">{tasks.filter(t => (t.subProject?._id || t.subProject) === sp._id).length}</Badge>
                                      </Card.Header>
                                      <Card.Body className="p-2">
                                        {tasks.filter(t => (t.subProject?._id || t.subProject) === sp._id).map(task => (
                                          <div key={task._id} className="d-flex justify-content-between align-items-center mb-1 p-1 rounded hover-bg-light" style={{ fontSize: '0.85rem' }}>
                                            <div className="d-flex align-items-center gap-2">
                                              <i className={`bi bi-circle-fill xm-icon text-${task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'secondary'}`}></i>
                                              <span>{task.title}</span>
                                            </div>
                                            <i className="bi bi-pencil text-muted cursor-pointer" onClick={() => handleEditTask(task)}></i>
                                          </div>
                                        ))}
                                      </Card.Body>
                                    </Card>
                                  )
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="tasks" title={`Tasks (${tasks.length})`}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Project Tasks</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingTask(null);
                    setTaskFormData({
                      title: '',
                      description: '',
                      status: 'To Do',
                      priority: 'Medium',
                      progress: 0,
                      assignedTo: '',
                      deadline: new Date().toISOString().split('T')[0],
                      subProject: '',
                      notes: ''
                    });
                    setShowTaskModal(true);
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add General Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check2-square" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">No tasks assigned to this project yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Assigned To</th>
                        <th>Priority</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task._id}>
                          <td>
                            <strong>{task.title}</strong>
                            <div className="text-muted small">
                              {task.subProject ? (
                                <span><i className="bi bi-layers me-1"></i> {typeof task.subProject === 'object' ? task.subProject.name : 'Sub-project'}</span>
                              ) : (
                                <span><i className="bi bi-folder me-1"></i> General Project Task</span>
                              )}
                            </div>
                          </td>
                          <td>{task.assignedTo?.name || 'Unassigned'}</td>
                          <td>
                            <Badge bg={task.priority === 'Urgent' ? 'danger' : task.priority === 'High' ? 'warning' : 'info'}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td style={{ width: '150px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <ProgressBar
                                now={task.progress}
                                style={{ height: '6px', flex: 1 }}
                                variant={task.progress === 100 ? 'success' : 'primary'}
                              />
                              <small>{task.progress}%</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'secondary'}>
                              {task.status}
                            </Badge>
                          </td>
                          <td>
                            {formatDate(task.deadline)}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setEditingTask(task);
                                  setTaskFormData({
                                    title: task.title,
                                    description: task.description || '',
                                    status: task.status,
                                    priority: task.priority,
                                    progress: task.progress,
                                    assignedTo: task.assignedTo?._id || task.assignedTo,
                                    deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
                                    subProject: task.subProject?._id || task.subProject || '',
                                    notes: task.notes || ''
                                  });
                                  setShowTaskModal(true);
                                }}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={async () => {
                                  if (window.confirm('Delete this task?')) {
                                    await tasksAPI.delete(task._id);
                                    fetchProjectData();
                                  }
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
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
        </Tab>

        <Tab eventKey="payments" title={`Payments (${payments.length})`}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Payment History</h5>
                {user.role !== 'developer' && (
                  <Button variant="success" size="sm" onClick={() => setShowPaymentModal(true)}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Payment
                  </Button>
                )}
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-cash-stack" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">No payments recorded yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        {user.role !== 'developer' && <th>Amount</th>}
                        <th>Method</th>
                        <th>Reference</th>
                        {user.role !== 'developer' && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>{formatDate(payment.paymentDate)}</td>
                          {user.role !== 'developer' && <td className="text-success fw-bold">Rs. {payment.amount.toLocaleString()}</td>}
                          <td>{payment.paymentMethod}</td>
                          <td>{payment.reference || '-'}</td>
                          {user.role !== 'developer' && (
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handlePaymentDelete(payment._id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {user.role !== 'developer' && (
                      <tfoot>
                        <tr>
                          <th>Total Paid:</th>
                          <th className="text-success">Rs. {project.paidAmount.toLocaleString()}</th>
                          <th colSpan="3"></th>
                        </tr>
                      </tfoot>
                    )}
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="documents" title={`Docs (${invoices.length})`}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Generated Documents</h5>
                {user.role !== 'developer' && (
                  <div className="d-flex gap-2">
                    <Button variant="outline-info" size="sm" onClick={handleGenerateProposal}>
                      <i className="bi bi-file-earmark-diff me-2"></i>
                      Generate Proposal
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={handleGenerateQuotation}>
                      <i className="bi bi-file-text me-2"></i>
                      Generate Quotation
                    </Button>
                    <Button variant="outline-success" size="sm" onClick={handleGenerateInvoice}>
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Generate Invoice
                    </Button>
                  </div>
                )}
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-files" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">No documents generated yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Document No</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((doc) => (
                        <tr key={doc._id}>
                          <td><strong>{doc.documentId}</strong></td>
                          <td>
                            <Badge bg={doc.type === 'Invoice' ? 'primary' : doc.type === 'Quotation' ? 'info' : 'warning'}>
                              {doc.type}
                            </Badge>
                          </td>
                          <td>{formatDate(doc.createdAt)}</td>
                          {user.role !== 'developer' && <td>Rs. {doc.totalAmount.toLocaleString()}</td>}
                          <td>
                            <Badge bg={doc.status === 'Paid' ? 'success' : 'secondary'}>{doc.status}</Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link to={doc.type === 'Invoice' ? `/invoice/${doc._id}` : doc.type === 'Quotation' ? `/quotation/${doc._id}` : `/proposal/${doc._id}`}>
                                <Button variant="outline-primary" size="sm">
                                  <i className="bi bi-eye"></i>
                                </Button>
                              </Link>
                              {user.role !== 'developer' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteInvoice(doc._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              )}
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
        </Tab>

        <Tab eventKey="details" title="Project Details">
          <Card>
            <Card.Body>
              <h5 className="mb-3">Project Information</h5>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted">Client Name</h6>
                    <p>{project.clientName}</p>
                  </div>
                  {project.clientEmail && (
                    <div className="mb-3">
                      <h6 className="text-muted">Client Email</h6>
                      <p>{project.clientEmail}</p>
                    </div>
                  )}
                  {project.clientPhone && (
                    <div className="mb-3">
                      <h6 className="text-muted">Client Phone</h6>
                      <p>{project.clientPhone}</p>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted">Start Date</h6>
                    <p>{formatDate(project.startDate)}</p>
                  </div>
                  <div className="mb-3">
                    <h6 className="text-muted">Created</h6>
                    <p>{formatDate(project.createdAt)}</p>
                  </div>
                  <div className="mb-3">
                    <h6 className="text-muted">Last Updated</h6>
                    <p>{formatDate(project.updatedAt)}</p>
                  </div>
                </Col>
              </Row>
              {project.description && (
                <div>
                  <h6 className="text-muted">Description</h6>
                  <p>{project.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Edit Project Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleProjectUpdate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="clientName"
                    value={projectFormData.clientName}
                    onChange={(e) => setProjectFormData({ ...projectFormData, clientName: e.target.value })}
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
                    value={projectFormData.clientEmail}
                    onChange={(e) => setProjectFormData({ ...projectFormData, clientEmail: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="clientPhone"
                    value={projectFormData.clientPhone}
                    onChange={(e) => setProjectFormData({ ...projectFormData, clientPhone: e.target.value })}
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
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={projectFormData.status}
                onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Sub-Project Modal */}
      <Modal show={showSubProjectModal} onHide={() => setShowSubProjectModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingSubProject ? 'Edit Sub-Project' : 'Add Sub-Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubProjectSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Sub-Project Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={subProjectFormData.name}
                onChange={(e) => setSubProjectFormData({ ...subProjectFormData, name: e.target.value })}
                placeholder="e.g., Making a quotation form"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={subProjectFormData.description}
                onChange={(e) => setSubProjectFormData({ ...subProjectFormData, description: e.target.value })}
                placeholder="Brief description of the sub-project"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Features / Key Details (One per line)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="features"
                value={subProjectFormData.features}
                onChange={(e) => setSubProjectFormData({ ...subProjectFormData, features: e.target.value })}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              />
              <Form.Text className="text-muted">
                Each line will be shown as a bullet point in the proposal/invoice.
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (Rs.) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={subProjectFormData.price}
                    onChange={(e) => setSubProjectFormData({ ...subProjectFormData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline *</Form.Label>
                  <Form.Control
                    type="date"
                    name="deadline"
                    value={subProjectFormData.deadline}
                    onChange={(e) => setSubProjectFormData({ ...subProjectFormData, deadline: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={subProjectFormData.status}
                onChange={(e) => setSubProjectFormData({ ...subProjectFormData, status: e.target.value })}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={subProjectFormData.notes}
                onChange={(e) => setSubProjectFormData({ ...subProjectFormData, notes: e.target.value })}
                placeholder="Additional notes or requirements"
              />
            </Form.Group>

            {/* Subscription Section */}
            <hr className="my-4" />
            <h6 className="mb-3">
              <i className="bi bi-arrow-repeat me-2" style={{ color: '#667eea' }}></i>
              Subscription Settings
            </h6>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="This is a subscription-based service"
                checked={subProjectFormData.isSubscription}
                onChange={(e) => setSubProjectFormData({
                  ...subProjectFormData,
                  isSubscription: e.target.checked,
                  subscriptionType: e.target.checked ? 'Monthly' : 'None'
                })}
              />
              <Form.Text className="text-muted">
                Enable if this service requires recurring payments (monthly or yearly)
              </Form.Text>
            </Form.Group>

            {subProjectFormData.isSubscription && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subscription Type *</Form.Label>
                      <Form.Select
                        name="subscriptionType"
                        value={subProjectFormData.subscriptionType}
                        onChange={(e) => setSubProjectFormData({ ...subProjectFormData, subscriptionType: e.target.value })}
                        required={subProjectFormData.isSubscription}
                      >
                        <option value="Monthly">📅 Monthly</option>
                        <option value="Yearly">📆 Yearly</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="alert alert-info py-2 px-3" style={{ fontSize: '0.875rem' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Recurring: <strong>Rs. {subProjectFormData.price.toLocaleString()}</strong> / {subProjectFormData.subscriptionType === 'Monthly' ? 'month' : 'year'}
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subscription Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="subscriptionStartDate"
                        value={subProjectFormData.subscriptionStartDate}
                        onChange={(e) => setSubProjectFormData({ ...subProjectFormData, subscriptionStartDate: e.target.value })}
                        required={subProjectFormData.isSubscription}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subscription End Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="subscriptionEndDate"
                        value={subProjectFormData.subscriptionEndDate}
                        onChange={(e) => setSubProjectFormData({ ...subProjectFormData, subscriptionEndDate: e.target.value })}
                      />
                      <Form.Text className="text-muted">
                        Leave empty for ongoing subscription
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="alert alert-warning" style={{ fontSize: '0.875rem' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Note:</strong> Subscription invoices will be generated separately and won't be included in the one-time project invoice.
                </div>
              </>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowSubProjectModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingSubProject ? 'Update Sub-Project' : 'Add Sub-Project'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePaymentSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Amount (Rs.) *</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
              <Form.Text className="text-muted">
                Remaining balance: Rs. {balance.toLocaleString()}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Date *</Form.Label>
              <Form.Control
                type="date"
                name="paymentDate"
                value={paymentFormData.paymentDate}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="paymentMethod"
                value={paymentFormData.paymentMethod}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Online Payment">Online Payment</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reference Number</Form.Label>
              <Form.Control
                type="text"
                name="reference"
                value={paymentFormData.reference}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                placeholder="Transaction ID, cheque number, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                placeholder="Additional payment notes"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit">
                Add Payment
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? 'Edit Task' : 'Add Task to Sub-Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTaskSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Task Title *</Form.Label>
              <Form.Control
                type="text"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Task description"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned To *</Form.Label>
                  <Form.Select
                    value={taskFormData.assignedTo}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                    required
                  >
                    <option value="">Select Team Member</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline *</Form.Label>
                  <Form.Control
                    type="date"
                    value={taskFormData.deadline}
                    onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={taskFormData.status}
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Progress: {taskFormData.progress}%</Form.Label>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={taskFormData.progress}
                    onChange={(e) => handleTaskProgressChange(e.target.value)}
                  />
                  <ProgressBar
                    now={taskFormData.progress}
                    variant={taskFormData.progress === 100 ? 'success' : 'primary'}
                    style={{ height: '5px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          <Alert variant="warning">
            <strong>Warning:</strong> All sub-projects and payments associated with this project will also be deleted.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleProjectDelete}>
            Delete Project
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProjectDetails;