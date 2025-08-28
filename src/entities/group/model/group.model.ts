import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  inviteCode: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  media: mongoose.Types.ObjectId[];
  mediaCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    mediaCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 초대 코드 생성 함수
function generateInviteCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// 고유한 초대 코드 생성 함수
async function generateUniqueInviteCode(): Promise<string> {
  const Group = mongoose.models.Group;
  let code = '';
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateInviteCode();

    if (Group) {
      const existingGroup = await Group.findOne({ inviteCode: code });
      if (!existingGroup) {
        isUnique = true;
      }
    } else {
      isUnique = true; // 첫 번째 그룹인 경우
    }
    attempts++;
  }

  if (!isUnique) {
    // 최대 시도 횟수를 초과했을 때는 타임스탬프 추가
    code = generateInviteCode() + Date.now().toString().slice(-2);
  }

  return code;
}

GroupSchema.pre('save', async function (next) {
  if (this.isNew && !this.inviteCode) {
    this.inviteCode = await generateUniqueInviteCode();
  }
  next();
});

export const Group = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema, 'photo_groups');
