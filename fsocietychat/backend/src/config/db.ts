import mongoose from 'mongoose';

export async function connectDB(uri?: string): Promise<void> {
  const MONGO_URI = uri || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not set in environment variables.');
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); 
  }
}

export default connectDB;
