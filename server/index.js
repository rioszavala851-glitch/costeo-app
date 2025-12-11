const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/subrecipes', require('./routes/subrecipes'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cloud-recipes', require('./routes/cloudRecipes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    console.log('Serving static files from:', path.join(__dirname, '../client/dist'));
    // Set static folder
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'))
    );
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
