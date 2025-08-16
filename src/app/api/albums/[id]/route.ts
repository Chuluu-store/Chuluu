import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "../../../../shared/api";
import { AlbumModel } from "../../../../entities/album";
import { dbConnect, transformAlbumDocument } from "../../../../shared/lib";
import {
  Album,
  AlbumDocument,
  AlbumUpdate,
} from "../../../../shared/types/album";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const album = (await AlbumModel.findById(
      id
    ).lean()) as AlbumDocument | null;

    if (!album) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Album not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Album>>({
      success: true,
      data: transformAlbumDocument(album),
    });
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch album",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const updates: AlbumUpdate = await request.json();

    const album = (await AlbumModel.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean()) as AlbumDocument | null;

    if (!album) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Album not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Album>>({
      success: true,
      data: transformAlbumDocument(album),
    });
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to update album",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const album = await AlbumModel.findByIdAndDelete(id);

    if (!album) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Album not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete album",
      },
      { status: 500 }
    );
  }
}
