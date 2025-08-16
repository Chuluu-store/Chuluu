import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  inviteCode: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  media: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  media: [{
    type: Schema.Types.ObjectId,
    ref: 'Media'
  }]
}, {
  timestamps: true
});

// 초대 코드 생성 함수
GroupSchema.pre('save', async function(next) {
  if (!this.inviteCode) {
    // 6자리 랜덤 코드 생성
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.inviteCode = code;
  }
  next();
});

export const Group = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);