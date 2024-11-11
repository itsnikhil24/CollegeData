const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const ejs = require('ejs');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const xlsx = require('xlsx');
const excelFilePath = path.join(__dirname, 'colleges.xlsx');
const workbook = xlsx.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
const cleanedData = sheetData.map(college => {
    const cleanedCollege = {};
    Object.keys(college).forEach(key => {
        cleanedCollege[key.trim()] = college[key];  // Trim the spaces from keys
    });
    return cleanedCollege;
});







// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;
const apiKey = process.env.apiKey;
const mongoURI = process.env.mongoURI;

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

function isloggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/");

    try {
        const data = jwt.verify(token, "secretKey");
        req.user = data;
        next();
    } catch (err) {
        console.error("JWT verification error:", err);
        res.redirect("/");
    }
}

// Routes
app.get("/", (req, res) => res.render("login_page"));
app.get("/home", (req, res) => {
    res.render("Home", { sheetData: cleanedData });
});
app.get("/college", (req, res) => {
    res.render("index.ejs");
});


// Route to render colleges data from the Excel sheet
app.get("/colleges", isloggedIn, (req, res) => {
    res.render("colleges", { colleges: sheetData });
});


// Database model
const User = require('./models/model'); // Assuming you have a User model defined in models/user.js

// Registration route
app.post('/register', async (req, res) => {
    try {
        const { name, username, password, phone_number } = req.body;
        if (!name || !username || !password || !phone_number) return res.status(400).send("All fields are required.");

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).send("User already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, password: hashedPassword, phone_number });

        await newUser.save();
        res.redirect("/");
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("Error registering user.");
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const userRecord = await User.findOne({ username: req.body.username });
        if (!userRecord) return res.status(400).send("User not found.");

        const isPasswordMatch = await bcrypt.compare(req.body.password, userRecord.password);
        if (isPasswordMatch) {
            const token = jwt.sign({ username: userRecord.username }, "secretKey");
            res.cookie("token", token);
            res.redirect("/home");
        } else {
            res.status(400).send("Incorrect Password");
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Login failed.");
    }
});

// Logout route
app.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


