import express from 'express';
import { upload } from './utils/multer.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple HTML form for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Multer Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #f97316; }
        form { margin-bottom: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        input, button { margin: 10px 0; }
        button { background: #f97316; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
        img { max-width: 300px; border: 1px solid #ddd; padding: 5px; margin-top: 10px; }
        .result { padding: 15px; background: #f5f5f5; border-radius: 5px; margin-top: 20px; }
        pre { overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Multer Image Upload Test</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <div>
          <label for="productName">Product Name:</label>
          <input type="text" id="productName" name="productName" required>
        </div>
        <div>
          <label for="productImage">Product Image:</label>
          <input type="file" id="productImage" name="productImage" accept="image/*" required>
        </div>
        <button type="submit">Upload</button>
      </form>
      <div id="result"></div>
      
      <script>
        document.querySelector('form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          
          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = `
              <div class="result">
                <h3>Upload Successful!</h3>
                <p>Product Name: ${result.productName}</p>
                <p>Image Path: ${result.productImage}</p>
                <img src="${result.productImage}" alt="Uploaded Image">
                <h4>Full Response:</h4>
                <pre>${JSON.stringify(result, null, 2)}</pre>
              </div>
            `;
          } catch (error) {
            document.getElementById('result').innerHTML = `
              <div class="result" style="background: #ffeeee;">
                <h3>Error!</h3>
                <p>${error.message}</p>
              </div>
            `;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Handle the upload
app.post('/upload', upload.single('productImage'), (req, res) => {
  try {
    // Get the file path if an image was uploaded
    const productImage = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Return the result
    res.json({
      success: true,
      productName: req.body.productName,
      productImage: productImage,
      file: req.file
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start the server
const PORT = 3500;
app.listen(PORT, () => {
  console.log(`Multer test server running at http://localhost:${PORT}`);
});