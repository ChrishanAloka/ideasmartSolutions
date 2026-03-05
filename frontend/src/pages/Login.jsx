import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { authAPI } from '../utils/api';
import logo from '../assets/logo.png';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      onLogin(response.data);
      // Redirect developers to tasks, everyone else to dashboard
      if (response.data.role === 'developer') {
        navigate('/tasks');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <div className="text-center mb-5" style={{ animation: 'fadeIn 0.6s ease-out' }}>
              {/* <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
                transform: 'rotate(-10deg)'
              }}>
                <i className="bi bi-lightbulb-fill text-white" style={{ fontSize: '2.5rem', transform: 'rotate(10deg)' }}></i>
              </div> */}
              <img src={logo} alt="Logo" style={{ height: '100px', margin: '0 0 0 0' }} />
              <h1 className="mb-2" style={{
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '2.5rem'
              }}>
                ideasmart Solutions
              </h1>
              <p className="text-white" style={{ fontSize: '1.1rem', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                Giving smart solutions for your business
              </p>
            </div>

            <Card style={{ borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
              <Card.Body className="p-5">
                <h3 className="mb-4 text-center" style={{ fontWeight: '700', color: '#1f2937' }}>
                  Welcome Back
                </h3>
                <p className="text-center text-muted mb-4">Sign in to continue to your dashboard</p>

                {error && (
                  <Alert variant="danger" className="d-flex align-items-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                      <i className="bi bi-envelope-fill me-2" style={{ color: '#667eea' }}></i>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      style={{
                        padding: '0.875rem 1rem',
                        fontSize: '1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                      <i className="bi bi-lock-fill me-2" style={{ color: '#667eea' }}></i>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      style={{
                        padding: '0.875rem 1rem',
                        fontSize: '1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mb-3"
                    disabled={loading}
                    style={{
                      padding: '1rem',
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="mb-0 text-muted">
                      Don't have an account?{' '}
                      <Link
                        to="/register"
                        style={{
                          color: '#667eea',
                          fontWeight: '600',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        Create one now
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <p className="text-white mb-0" style={{ fontSize: '0.9rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                <i className="bi bi-shield-check me-2"></i>
                Your data is secure and encrypted
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;