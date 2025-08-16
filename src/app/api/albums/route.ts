import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../../shared/api";
import { AlbumModel } from "../../../entities/album";
import {
  dbConnect,
  transformAlbumDocuments,
  transformAlbumDocument,
} from "../../../shared/lib";
import { Album, AlbumDocument, AlbumCreate } from "../../../shared/types/album";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const albums = (await AlbumModel.find()
      .sort({ createdAt: -1 })
      .lean()) as AlbumDocument[];

    return NextResponse.json<ApiResponse<Album[]>>({
      success: true,
      data: transformAlbumDocuments(albums),
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch albums",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const albumData: AlbumCreate = await request.json();

    if (!albumData.name?.trim()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Album name is required",
        },
        { status: 400 }
      );
    }

    const album = await AlbumModel.create({
      name: albumData.name.trim(),
      description: albumData.description?.trim(),
      isPublic: albumData.isPublic || false,
    });

    const albumDoc = album.toObject() as AlbumDocument;

    return NextResponse.json<ApiResponse<Album>>({
      success: true,
      data: transformAlbumDocument(albumDoc),
    });
  } catch (error) {
    console.error("Error creating album:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to create album",
      },
      { status: 500 }
    );
  }
}
