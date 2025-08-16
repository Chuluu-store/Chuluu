import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'chuluu-secret-key-2024';

// MongoDB 연결
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  return mongoose.connect(process.env.MONGODB_URI!);
};

// Group 모델
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  inviteCode: { type: String, unique: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// User 모델
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
}, { timestamps: true });

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { username, email, password } = await request.json();
    
    // 유효성 검사
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다' },
        { status: 400 }
      );
    }
    
    // 중복 확인
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 사용자명 또는 이메일입니다' },
        { status: 409 }
      );
    }
    
    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      groups: []
    });
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 응답
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        groups: []
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}