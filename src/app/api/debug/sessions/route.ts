import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "../../../../shared/lib/database";
import { UploadSession } from "../../../../entities/upload/model/upload-session.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 모든 업로드 세션 조회
    const allSessions = await UploadSession.find().lean();

    return NextResponse.json({
      success: true,
      debug: {
        totalSessions: allSessions.length,
        sessions: allSessions.map((s) => ({
          id: s._id,
          sessionId: s.sessionId,
          status: s.status,
          totalFiles: s.totalFiles,
          completedFiles: s.completedFiles,
          failedFiles: s.failedFiles,
          groupId: s.groupId,
          userId: s.userId,
          createdAt: s.createdAt,
          files: s.files?.map((f: any) => ({
            filename: f.filename,
            status: f.status,
            progress: f.progress,
            error: f.error,
            mediaId: f.mediaId,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Debug sessions error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
