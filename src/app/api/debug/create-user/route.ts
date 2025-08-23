import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../shared/lib/database";
import { User } from "../../../../entities/user/model/user.model";
import { Group } from "../../../../entities/group/model/group.model";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, username, email } = await request.json();

    if (!userId || !username || !email) {
      return NextResponse.json(
        { error: "userId, username, email이 필요합니다" },
        { status: 400 }
      );
    }

    console.log(`🔄 Creating user with ID: ${userId}`);

    // Check if user already exists
    const existingUser = await User.findById(userId);
    if (existingUser) {
      console.log("✅ User already exists:", existingUser._id);
      return NextResponse.json({
        success: true,
        message: "사용자가 이미 존재합니다",
        user: existingUser
      });
    }

    // Create new user with specific ID
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(userId),
      username,
      email,
      password: "$2b$10$dummy.hash.for.now", // Dummy hash
      groups: []
    });

    await newUser.save();
    console.log("✅ Created new user:", newUser._id);

    // Find all orphaned groups and assign to this user
    const orphanedGroups = await Group.find({
      $or: [
        { owner: null },
        { owner: userId },
        { members: { $size: 0 } }
      ]
    });

    console.log(`Found ${orphanedGroups.length} orphaned groups`);

    for (const group of orphanedGroups) {
      group.owner = newUser._id;
      group.members = [newUser._id];
      await group.save();
      console.log(`✅ Fixed group ${group._id}`);
    }

    // Update user's groups array
    const userGroups = await Group.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }).select("_id");

    newUser.groups = userGroups.map(g => g._id);
    await newUser.save();

    return NextResponse.json({
      success: true,
      message: "사용자 생성 및 그룹 수정 완료",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        groupCount: userGroups.length
      },
      fixedGroups: orphanedGroups.length
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "사용자 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}