import mongoose from 'mongoose';

let inMemoryServer: any = null;

export async function connectDB(uri?: string): Promise<void> {
  const MONGO_URI = uri || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
      console.warn('Falling back to in-memory MongoDB for development.');
    }
  } else {
    console.warn('MONGO_URI not provided — starting in-memory MongoDB for development.');
  }

  try {
    const mod = await import('mongodb-memory-server');
    const MongoMemoryServer = mod.MongoMemoryServer || mod.default?.MongoMemoryServer;
    if (!MongoMemoryServer) throw new Error('mongodb-memory-server not available');
    inMemoryServer = await MongoMemoryServer.create();
    const uri2 = inMemoryServer.getUri();
    await mongoose.connect(uri2);
    console.log('Connected to in-memory MongoDB');
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err);
    console.error('To enable an in-memory fallback for local development, install mongodb-memory-server in backend:');
    console.error('  cd backend && npm install -D mongodb-memory-server');
    throw err;
  }
}

export async function stopInMemoryDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (inMemoryServer) {
      await inMemoryServer.stop();
      inMemoryServer = null;
    }
  } catch (err) {
    console.error('Error stopping in-memory MongoDB:', err);
  }
}

export default connectDB;
