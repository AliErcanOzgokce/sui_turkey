import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '../types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<UserDocument>({
  discordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  discordUsername: {
    type: String,
    required: true
  },
  discordAvatar: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  suiAddresses: [{
    type: String,
    index: true
  }],
  roles: [{
    type: String
  }],
  tokenBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  lastBalanceCheck: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre<UserDocument>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt field before updating
userSchema.pre<UserDocument>('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.model<UserDocument>('User', userSchema); 