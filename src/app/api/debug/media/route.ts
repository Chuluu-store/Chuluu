import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/database';
import { Media } from '@/entities/media/model/media.model';
import { Group } from '@/entities/group/model/group.model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 모든 미디어 조회
    const allMedia = await Media.find().lean();
    
    // 모든 그룹 조회  
    const allGroups = await Group.find().lean();
    
    // 미디어 통계
    const totalMedia = await Media.countDocuments();
    const completedMedia = await Media.countDocuments({ status: 'completed' });
    const uploadingMedia = await Media.countDocuments({ status: 'uploading' });
    const failedMedia = await Media.countDocuments({ status: 'failed' });
    
    return NextResponse.json({
      success: true,
      debug: {
        totalMedia,
        completedMedia,
        uploadingMedia,
        failedMedia,
        allMedia: allMedia.map(m => ({
          id: m._id,
          filename: m.filename,
          originalName: m.originalName,
          status: m.status,
          groupId: m.groupId,
          uploadedAt: m.uploadedAt,
          path: m.path,
          takenAt: m.metadata?.takenAt
        })),
        allGroups: allGroups.map(g => ({
          id: g._id,
          name: g.name,
          memberCount: g.members?.length || 0,
          mediaCount: g.media?.length || 0
        }))
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}