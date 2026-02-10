const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/mainProjectRoutes'));
app.use('/api/subprojects', require('./routes/subProjectRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/subscription-invoices', require('./routes/subscriptionInvoiceRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IdeaSmart Solutions Project Manager API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects'
    }
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});