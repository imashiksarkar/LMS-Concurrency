# LMS-Concurrency Documentation

## Overview

LMS-Concurrency is a Learning Management System (LMS) designed to solve concurrency problems in course enrollment scenarios. This project demonstrates handling race conditions when multiple users attempt to enroll in courses with limited seat availability simultaneously.

## Problem Statement

In a typical LMS, when multiple students try to enroll in a course simultaneously, especially when there are limited seats available, several concurrency issues can arise:

- **Race Conditions**: Multiple transactions reading the same seat count and attempting to enroll simultaneously
- **Overbooking**: More students enrolled than available seats
- **Lost Updates**: Enrollment counts not accurately reflecting the actual number of enrolled students
- **Data Inconsistency**: Mismatch between order records and course enrollment data
- **Price Synchronization**: Inconsistent pricing between orders and courses

This project implements solutions to prevent these issues using various concurrency control mechanisms.

## Architecture

The system follows a microservices architecture with the following components:

```
┌─────────────┐
│   Nginx     │  (Load Balancer / Reverse Proxy)
└──────┬──────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
┌──────▼──────┐ ┌───▼────────┐ ┌──▼──────────┐
│   Course    │ │   Order    │ │  Database   │
│  Service    │ │  Service   │ │  (Shared)   │
└─────────────┘ └────────────┘ └─────────────┘
```

### Component Responsibilities

- **Nginx**: Routes requests to appropriate services and provides load balancing
- **Course Service**: Manages course information, availability, and seat counts
- **Order Service**: Handles enrollment orders and transaction management

## Project Structure

```
LMS-Concurrency/
├── course/              # Course management service
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── order/               # Order/enrollment service
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── nginx/               # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml   # Docker orchestration
├── .gitignore
└── README.md
```

## ER Diagram

![course service](/diagrams/course.png)
![course service](/diagrams/order.png)

## Technologies Used

### Core Technologies

- **TypeScript** (93.6%): Primary programming language for type-safe development
- **Node.js**: Runtime environment for backend services
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container orchestration

### Supporting Technologies

- **Jupyter Notebook** (4.0%): For testing and analysis
- **Nginx**: Reverse proxy and load balancer

## Services

### Course Service

The Course Service manages all course-related operations:

**Responsibilities:**

- Course creation and management
- Seat availability tracking
- Course information retrieval
- Seat count updates with concurrency control

**Key Features:**

- Real-time seat availability checking
- Atomic seat count operations
- Course listing and filtering

### Order Service

The Order Service handles enrollment transactions:

**Responsibilities:**

- Processing enrollment requests
- Order validation
- Transaction management
- Integration with course availability

**Key Features:**

- Transactional enrollment processing
- Rollback mechanisms for failed enrollments
- Order history tracking

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js (v14 or higher) for local development
- Git for version control

### How to run?

**Note:** .env files are pushed to github for testing purpose

1. **Clone the repository**

   ```bash
   git clone https://github.com/imashiksarkar/LMS-Concurrency.git
   cd LMS-Concurrency
   ```

2. **Start services with Docker Compose**

   ```bash
   docker-compose up -d
   ```

## API Endpoints

[Postman Collection](https://documenter.getpostman.com/view/16493198/2sB3dSRV59)

### Course Service Endpoints

```
GET    /course-srv/courses           # List all courses
GET    /course-srv/courses/:id       # Get course details
POST   /course-srv/courses           # Create new course
PUT    /course-srv/courses/:id       # Update course
```

### Order Service Endpoints

```
POST   /order-srv/orders            # Create enrollment order
GET    /order-srv/orders/:orderId/pay       # Pay for order
```

## Testing

### Running Tests

```bash
# Unit tests
pnpm run test
```

### Concurrency Testing Scenarios

1. **Simultaneous Enrollments**: Multiple users enrolling in same course
2. **Edge Cases**: Last seat availability
3. **High Load**: Stress testing with hundreds of concurrent requests

### Testing Tools

- Jest for unit testing
- Supertest for API testing
- Jupyter notebooks analysis

## Common Issues and Solutions

### Issue: Race Condition During Enrollment

**Problem**: Multiple users enrolling simultaneously causing overbooking

**Solution**: Implement application level locking with `async-mutex` library

### Issue: Deadlocks

**Problem**: Services waiting on each other's locks

**Solution**:

- Consistent lock ordering
- Deadlock detection and retry logic
- Transaction timeout configuration

### Issue: Service Communication Failures

**Problem**: Order service can't reach course service

**Solution**:

- Implement retry logic
- Circuit breaker pattern (Not Implemented)
- Health check endpoints (/order-srv/health, /course-srv/health)

## Future Enhancements

- [ ] Implement Redis for distributed caching
- [ ] Add message queue Kafka for async processing
- [ ] Implement saga pattern for distributed transactions
- [ ] Add comprehensive monitoring with Prometheus/Grafana
- [ ] Implement rate limiting
- [ ] Add CI/CD pipeline

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a Pull Request

### Contribution Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Follow existing code style and conventions

## License

This project is available for educational purposes. Please check the repository for specific license information.

## Author

**Ashik Sarkar**

- GitHub: [@imashiksarkar](https://github.com/imashiksarkar)

## Acknowledgments

This project was created to demonstrate practical solutions to concurrency problems in distributed systems, specifically in the context of Learning Management Systems.

---

**Note**: This documentation is based on the project structure and common patterns. Specific implementation details may vary. Please refer to the source code for exact implementations and configurations.
