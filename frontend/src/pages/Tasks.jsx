import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Table, ProgressBar } from 'react-bootstrap';
import { tasksAPI, projectsAPI, authAPI } from '../utils/api';

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    progress: 0,
    assignedTo: '',
    deadline: '',
    mainProject: '',
    subProject: '',
    tags: '',
    notes: ''
  });

  const [subProjects, setSubProjects] = useState([]);
  const [loadingSubProjects, setLoadingSubProjects] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter, projectFilter, showCompleted]);

  useEffect(() => {
    if (formData.mainProject) {
      fetchSubProjects(formData.mainProject);
    } else {
      setSubProjects([]);
      setFormData(prev => ({ ...prev, subProject: '' }));
    }
  }, [formData.mainProject]);

  const fetchSubProjects = async (projectId) => {
    try {
      setLoadingSubProjects(true);
      const res = await projectsAPI.getSubProjects(projectId);
      setSubProjects(res.data);
      setLoadingSubProjects(false);
    } catch (err) {
      console.error('Failed to fetch sub-projects', err);
      setLoadingSubProjects(false);
    }
  };

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, statsRes, usersRes] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
        tasksAPI.getStats(),
        authAPI.getUsers()
      ]);

      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'All') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (projectFilter !== 'All') {
      if (projectFilter === 'None') {
        filtered = filtered.filter(task => !task.mainProject);
      } else {
        filtered = filtered.filter(task => (task.mainProject?._id || task.mainProject) === projectFilter);
      }
    }

    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'Completed');
    }

    setFilteredTasks(filtered);
  };

  const handleProgressChange = (value) => {
    const progress = parseInt(value);
    let status = formData.status;

    if (progress === 100) {
      status = 'Completed';
    } else if (progress > 0) {
      status = 'In Progress';
    }

    setFormData({ ...formData, progress, status });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        mainProject: formData.mainProject || null,
        subProject: formData.subProject || null
      };

      if (editingTask) {
        await tasksAPI.update(editingTask._id, taskData);
      } else {
        await tasksAPI.create(taskData);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      mainProject: task.mainProject?._id || '',
      subProject: task.subProject?._id || task.subProject || '',
      tags: task.tags?.join(', ') || '',
      notes: task.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      progress: 0,
      assignedTo: '',
      deadline: '',
      mainProject: '',
      subProject: '',
      tags: '',
      notes: ''
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'success',
      'Medium': 'info',
      'High': 'warning',
      'Urgent': 'danger'
    };
    return colors[priority] || 'secondary';
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'secondary',
      'In Progress': 'primary',
      'Review': 'warning',
      'Completed': 'success',
      'Cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  };

  const isOverdue = (deadline, status) => {
    return new Date(deadline) < new Date() && status !== 'Completed';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <Container className="py-4">
      {/* Header */}
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
              <i className="bi bi-check2-square me-3" style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}></i>
              Task Management
            </h2>
            <p className="text-white mb-0" style={{ fontSize: '1.05rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Track and manage all your office tasks efficiently
            </p>
          </div>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              background: 'white',
              color: '#667eea',
              border: 'none'
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            New Task
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
            <h3 className="mb-0">{stats.total || 0}</h3>
            <small>Total Tasks</small>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)', color: 'white' }}>
            <h3 className="mb-0">{stats.toDo || 0}</h3>
            <small>To Do</small>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' }}>
            <h3 className="mb-0">{stats.inProgress || 0}</h3>
            <small>In Progress</small>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
            <h3 className="mb-0">{stats.completed || 0}</h3>
            <small>Completed</small>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
            <h3 className="mb-0">{stats.overdue || 0}</h3>
            <small>Overdue</small>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center p-3" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
            <h3 className="mb-0">{stats.highPriority || 0}</h3>
            <small>High Priority</small>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontWeight: '600',
              background: 'white'
            }}
          >
            <option value="All">All Status</option>
            <option value="To Do">📝 To Do</option>
            <option value="In Progress">⚡ In Progress</option>
            <option value="Review">👀 Review</option>
            <option value="Completed">✅ Completed</option>
            <option value="Cancelled">❌ Cancelled</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontWeight: '600',
              background: 'white'
            }}
          >
            <option value="All">All Priority</option>
            <option value="Low">🟢 Low</option>
            <option value="Medium">🟡 Medium</option>
            <option value="High">🟠 High</option>
            <option value="Urgent">🔴 Urgent</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontWeight: '600',
              background: 'white'
            }}
          >
            <option value="All">All Projects</option>
            <option value="None">📋 General Tasks</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>{project.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3} className="d-flex align-items-center">
          <Form.Check
            type="switch"
            id="show-completed-switch"
            label="Show Completed"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="fw-bold text-white shadow-sm"
          />
        </Col>
      </Row>

      {/* Results Info */}
      {
        (statusFilter !== 'All' || priorityFilter !== 'All' || projectFilter !== 'All') && (
          <Row className="mb-3">
            <Col>
              <Badge bg="primary" style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
              </Badge>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setProjectFilter('All');
                }}
                style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Clear filters
              </Button>
            </Col>
          </Row>
        )
      }

      {/* Tasks Table */}
      <Card>
        <Card.Body>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <h4 className="mt-3">No tasks found</h4>
              <p className="text-muted">
                {tasks.length === 0 ? 'Create your first task to get started' : 'Try adjusting your filters'}
              </p>
              {tasks.length === 0 && (
                <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Task
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Task</th>
                    <th style={{ width: '15%' }}>Assigned To</th>
                    <th style={{ width: '12%' }}>Priority</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '15%' }}>Progress</th>
                    <th style={{ width: '12%' }}>Deadline</th>
                    <th style={{ width: '4%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task._id}>
                      <td>
                        <div>
                          <strong>{task.title}</strong>
                          {task.mainProject && (
                            <div className="text-muted small">
                              <i className="bi bi-folder me-1"></i>
                              {task.mainProject.name}
                              {task.subProject && (
                                <>
                                  <i className="bi bi-chevron-right mx-1"></i>
                                  <i className="bi bi-layers me-1"></i>
                                  {typeof task.subProject === 'object' ? task.subProject.name : 'Sub-project'}
                                </>
                              )}
                            </div>
                          )}
                          {task.description && (
                            <div className="text-muted small mt-1">{task.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <i className="bi bi-person-fill me-1" style={{ color: '#667eea' }}></i>
                        {task.assignedTo?.name || 'Unassigned'}
                      </td>
                      <td>
                        <Badge bg={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <ProgressBar
                            now={task.progress}
                            label={`${task.progress}%`}
                            variant={task.progress === 100 ? 'success' : 'primary'}
                            style={{ height: '20px' }}
                          />
                        </div>
                      </td>
                      <td>
                        <div>
                          {formatDate(task.deadline)}
                          {isOverdue(task.deadline, task.status) && (
                            <Badge bg="danger" className="ms-2">Overdue</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(task)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(task._id)}
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

      {/* Task Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Task Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Design logo for client"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task details and requirements..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned To *</Form.Label>
                  <Form.Select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
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
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="To Do">📝 To Do</option>
                    <option value="In Progress">⚡ In Progress</option>
                    <option value="Review">👀 Review</option>
                    <option value="Completed">✅ Completed</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Progress: {formData.progress}%</Form.Label>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progress}
                    onChange={(e) => handleProgressChange(e.target.value)}
                  />
                  <ProgressBar
                    now={formData.progress}
                    variant={formData.progress === 100 ? 'success' : 'primary'}
                    style={{ height: '5px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Link to Project (Optional)</Form.Label>
              <Form.Select
                value={formData.mainProject}
                onChange={(e) => setFormData({ ...formData, mainProject: e.target.value })}
              >
                <option value="">No Project (General Task)</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {formData.mainProject && (
              <Form.Group className="mb-3">
                <Form.Label>Link to Sub-Project (Optional)</Form.Label>
                <Form.Select
                  value={formData.subProject}
                  onChange={(e) => setFormData({ ...formData, subProject: e.target.value })}
                  disabled={loadingSubProjects}
                >
                  <option value="">No Sub-Project (General Project Task)</option>
                  {subProjects.map(sp => (
                    <option key={sp._id} value={sp._id}>{sp.name}</option>
                  ))}
                </Form.Select>
                {loadingSubProjects && <Form.Text className="text-muted">Loading sub-projects...</Form.Text>}
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Tags (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., design, urgent, client-work"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container >
  );
}

export default Tasks;