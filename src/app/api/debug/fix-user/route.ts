import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../shared/lib/database";
import { User } from "../../../../entities/user/model/user.model";
import { Group } from "../../../../entities/group/model/group.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { oldUserId, newUserId } = await request.json();

    if (!oldUserId || !newUserId) {
      return NextResponse.json(
        { error: "oldUserId와 newUserId가 필요합니다" },
        { status: 400 }
      );
    }

    console.log(`🔄 Migrating user from ${oldUserId} to ${newUserId}`);

    // Check if new user exists
    const newUser = await User.findById(newUserId);
    if (!newUser) {
      console.error("❌ New user not found:", newUserId);
      
      // Create new user with the ID from token
      const createdUser = await User.create({
        _id: newUserId,
        username: "김승찬",
        email: "chan6502@gmail.com",
        password: "dummy", // Will need to be updated
        groups: []
      });
      
      console.log("✅ Created new user:", createdUser._id);
    }

    // Update all groups where oldUserId is owner
    const ownerResult = await Group.updateMany(
      { owner: oldUserId },
      { $set: { owner: newUserId } }
    );
    
    console.log(`✅ Updated ${ownerResult.modifiedCount} groups' owners`);

    // Update all groups where oldUserId is in members
    const memberResult = await Group.updateMany(
      { members: oldUserId },
      { 
        $pull: { members: oldUserId },
        $addToSet: { members: newUserId }
      }
    );
    
    console.log(`✅ Updated ${memberResult.modifiedCount} groups' members`);

    // Get all groups for the new user
    const userGroups = await Group.find({
      $or: [
        { owner: newUserId },
        { members: newUserId }
      ]
    }).select("_id");

    // Update user's groups array
    await User.findByIdAndUpdate(newUserId, {
      $set: { groups: userGroups.map(g => g._id) }
    });

    console.log(`✅ User migration completed`);

    return NextResponse.json({
      success: true,
      message: "사용자 ID 마이그레이션 완료",
      stats: {
        ownersUpdated: ownerResult.modifiedCount,
        membersUpdated: memberResult.modifiedCount,
        totalGroups: userGroups.length
      }
    });
  } catch (error) {
    console.error("Fix user error:", error);
    return NextResponse.json(
      { error: "사용자 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}