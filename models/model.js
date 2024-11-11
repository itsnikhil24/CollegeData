const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/collegedata', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('MongoDB connection error:', err));

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String, required: true }, // Change this to String
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'  // Ensure you reference the Item schema correctly
        }
    ]
});

module.exports = mongoose.model('User', userSchema);
