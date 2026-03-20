const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We use process.env.MONGO_URI to keep credentials out of the codebase
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;