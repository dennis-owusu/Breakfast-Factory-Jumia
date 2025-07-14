# Multer Integration for Image Uploads

## Overview

This document explains how Multer has been integrated into the Breakfast Factory Jumia e-commerce application for handling image uploads.

## Implementation Details

### 1. Multer Configuration

The Multer configuration is set up in `api/utils/multer.js`. It includes:

- **Storage Configuration**: Images are stored in the `api/uploads` directory with unique filenames
- **File Filtering**: Only image files (jpg, jpeg, png, gif) are accepted
- **Size Limits**: Maximum file size is set to 5MB

### 2. Server Configuration

The Express server in `api/index.js` has been configured to:

- Serve static files from the `uploads` directory using `express.static`
- This makes uploaded images accessible via the `/uploads` URL path

### 3. Route Integration

The product routes in `api/routes/product.route.js` have been updated to:

- Use Multer middleware for handling file uploads
- Accept image uploads via the `productImage` field in form data

### 4. Controller Updates

The product controller in `api/controllers/product.controller.js` has been updated to:

- Process uploaded files from `req.file` provided by Multer
- Store the file path in the product document

## Client-Side Implementation

The client-side code in `client/src/pages/outlet/ProductForm.jsx` has been updated to:

- Use `FormData` instead of JSON for submitting product data with images
- Handle file selection and preview
- Support both creating new products and updating existing ones with images

## Usage

### Creating a Product with Image

1. Select an image file using the file input in the product form
2. Fill in other product details
3. Submit the form
4. The image will be uploaded to the server and stored in the `uploads` directory
5. The product will be created with a reference to the uploaded image

### Updating a Product with Image

1. Load an existing product
2. Optionally select a new image file
3. Update other product details
4. Submit the form
5. If a new image is selected, it will replace the existing one

## Notes

- The `uploads` directory must exist and be writable
- In a production environment, consider using cloud storage (like AWS S3 or Cloudinary) instead of local storage
- For security, always validate and sanitize file uploads on the server side