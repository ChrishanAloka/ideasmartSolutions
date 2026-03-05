import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function Navigation({ user, onLogout }) {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">
          {/* <i className="bi bi-lightbulb-fill text-primary me-2"></i> */}
          <img src={logo} alt="Logo" style={{ height: '20px', margin: '0 7px 3px 0' }} />
          ideasmart Solutions
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {user.role !== 'developer' && (
              <Nav.Link as={Link} to="/dashboard">
                <i className="bi bi-grid-fill me-2"></i>
                Dashboard
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="/tasks">
              <i className="bi bi-check2-square me-2"></i>
              Tasks
            </Nav.Link>
            {user.role !== 'developer' && (
              <Nav.Link as={Link} to="/subscriptions">
                <i className="bi bi-arrow-repeat me-2"></i>
                Subscriptions
              </Nav.Link>
            )}
            <Nav.Item className="ms-3">
              <span className="text-muted">Welcome, <strong>{user.name}</strong></span>
            </Nav.Item>
            <Nav.Item className="ms-3">
              <Button variant="outline-danger" size="sm" onClick={onLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;