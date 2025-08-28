import { NextRequest, NextResponse } from 'next/server';

import { ApiResponse } from '../../../../../shared/api';
import { AlbumModel } from '../../../../../entities/album';
import { dbConnect, generateId } from '../../../../../shared/lib';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    // Generate a new share token
    const shareToken = generateId() + generateId(); // Double for extra length

    const album = await AlbumModel.findByIdAndUpdate(
      id,
      {
        shareToken,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!album) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Album not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ shareToken: string }>>({
      success: true,
      data: { shareToken },
    });
  } catch (error) {
    console.error('Error generating share token:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate share token',
      },
      { status: 500 }
    );
  }
}
