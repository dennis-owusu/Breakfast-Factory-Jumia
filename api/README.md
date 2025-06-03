# Breakfast Factory E-commerce API

This is the backend API for the Breakfast Factory e-commerce platform, built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Role-based access control (Admin, Outlet, User)
- Product management
- Outlet/Vendor management
- Admin dashboard
- Review system

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the API directory:
   ```
   cd api
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/breakfast-factory
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

### Running the Server

- Development mode with auto-restart:
  ```
  npm run dev
  ```
- Production mode:
  ```
  npm start
  ```

### Seeding Initial Admin User

To create an initial admin user:

```
npm run seed:admin
```

This will create an admin user with the following credentials:
- Email: admin@example.com
- Password: admin123

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users

- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Update user password

### Outlets

- `GET /api/outlets` - Get all outlets
- `GET /api/outlets/:id` - Get single outlet
- `POST /api/outlets` - Create new outlet (outlet role)
- `PUT /api/outlets/:id` - Update outlet (owner or admin)
- `DELETE /api/outlets/:id` - Delete outlet (owner or admin)
- `GET /api/outlets/my/outlet` - Get current user's outlet
- `GET /api/outlets/:id/products` - Get products for an outlet

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products/:id/reviews` - Add product review (user role)
- `GET /api/products/outlet` - Get outlet owner's products
- `POST /api/products/outlet` - Create new product (outlet role)
- `PUT /api/products/outlet/:id` - Update product (outlet owner)
- `DELETE /api/products/outlet/:id` - Delete product (outlet owner)

### Admin

- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create admin user
- `GET /api/admin/users/:id` - Get user by ID
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/outlets` - Get all outlets (admin view)
- `GET /api/admin/outlets/pending` - Get pending outlet verifications
- `PUT /api/admin/outlets/:id/verify` - Verify outlet
- `GET /api/admin/products` - Get all products (admin view)
- `PUT /api/admin/products/:id` - Update product (admin)
- `DELETE /api/admin/products/:id` - Delete product (admin)

## Authentication

The API uses JWT for authentication. To access protected routes, include the token in the request:

- As a Bearer token in the Authorization header:
  ```
  Authorization: Bearer <token>
  ```
- Or as a cookie (automatically set after login)

## Role-Based Access

- **Admin**: Full access to all routes
- **Outlet**: Can manage their outlet and products
- **User**: Can browse products, write reviews, and manage their profile