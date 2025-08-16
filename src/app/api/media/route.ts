import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/shared/lib/database";
import { MediaModel } from "@/entities/media/model/schema";


export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const media = await MediaModel.find()
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MediaModel.countDocuments();

    return NextResponse.json({
      media,
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
