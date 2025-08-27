import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../shared/lib/auth";
import { connectDB } from "../../../shared/lib/database";
import { Media } from "../../../entities/media/model/media.model";
import { User } from "../../../entities/user/model/user.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 토큰 확인
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    let userId = null;
    
    if (token) {
      try {
        const decoded = await verifyToken(token);
        userId = decoded?.userId;
      } catch (error) {
        // 토큰 검증 실패 시 userId는 null로 유지
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // 사용자가 로그인한 경우, 본인이 업로드한 미디어만 가져오기
    const query = userId ? { uploadedBy: userId, status: "completed" } : { status: "completed" };
    
    const media = await Media.find(query)
      .sort({ createdAt: -1, uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Media.countDocuments(query);

    // 응답 데이터 형식 맞추기
    const formattedMedia = media.map((item: any) => ({
      _id: item._id,
      filename: item.filename,
      originalName: item.originalName,
      path: item.path,
      thumbnail: item.thumbnailPath,
      isVideo: item.mimeType?.startsWith("video/"),
      uploadedAt: item.uploadedAt || item.createdAt,
      metadata: {
        width: item.metadata?.width,
        height: item.metadata?.height,
        dateTaken: item.metadata?.takenAt,
      },
      group: item.groupId ? { _id: item.groupId } : null,
      uploadedBy: item.uploadedBy,
    }));

    return NextResponse.json({
      media: formattedMedia,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
