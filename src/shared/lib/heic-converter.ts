import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import sharp from 'sharp';
const heicConvert = require('heic-convert');

/**
 * heic-convert 라이브러리를 사용하여 HEIC를 JPEG로 변환
 */
async function convertWithHeicConvert(inputPath: string): Promise<Buffer | null> {
  try {
    console.log('[convertWithHeicConvert] HEIC 변환 시작 :', inputPath);
    
    const inputBuffer = await readFile(inputPath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });
    
    console.log('[convertWithHeicConvert] HEIC 변환 완료 :', outputBuffer.length, 'bytes');
    return outputBuffer;
  } catch (error) {
    console.error('[convertWithHeicConvert] heic-convert 변환 실패 :', error);
    return null;
  }
}

/**
 * Sharp를 사용하여 HEIC를 JPEG로 변환 (fallback)
 */
async function convertWithSharp(inputPath: string): Promise<Buffer | null> {
  try {
    console.log('[convertWithSharp] HEIC 변환 시도 :', inputPath);
    
    const buffer = await sharp(inputPath)
      .jpeg({ quality: 90 })
      .toBuffer();
    
    console.log('[convertWithSharp] HEIC 변환 완료 :', buffer.length, 'bytes');
    return buffer;
  } catch (error) {
    console.error('[convertWithSharp] Sharp 변환 실패 :', error);
    return null;
  }
}

/**
 * HEIC 파일을 JPEG로 변환
 */
export async function convertHeicToJpeg(inputPath: string): Promise<Buffer | null> {
  if (!existsSync(inputPath)) {
    console.error('[convertHeicToJpeg] 입력 파일을 찾을 수 없습니다 :', inputPath);
    return null;
  }

  try {
    // 1. heic-convert 라이브러리 먼저 시도
    console.log('[convertHeicToJpeg] heic-convert로 HEIC 변환 시도 :', inputPath);
    let buffer = await convertWithHeicConvert(inputPath);
    
    if (buffer) {
      console.log('[convertHeicToJpeg] heic-convert 변환 성공 :', buffer.length, 'bytes');
      return buffer;
    }

    // 2. Sharp로 fallback 시도
    console.log('[convertHeicToJpeg] Sharp로 fallback 시도 :', inputPath);
    buffer = await convertWithSharp(inputPath);
    
    if (buffer) {
      console.log('[convertHeicToJpeg] Sharp 변환 성공 :', buffer.length, 'bytes');
      return buffer;
    }

    console.error('[convertHeicToJpeg] 모든 HEIC 변환 방법 실패');
    return null;
  } catch (error) {
    console.error('[convertHeicToJpeg] HEIC 변환 오류 :', error);
    return null;
  }
}

/**
 * HEIC 파일을 JPEG 썸네일로 변환
 */
export async function convertHeicToThumbnail(inputPath: string, size: number = 300): Promise<Buffer | null> {
  if (!existsSync(inputPath)) {
    console.error('[convertHeicToThumbnail] 입력 파일을 찾을 수 없습니다 :', inputPath);
    return null;
  }

  try {
    // 1. heic-convert로 먼저 JPEG 변환
    console.log('[convertHeicToThumbnail] heic-convert로 HEIC → JPEG 변환 :', inputPath);
    const jpegBuffer = await convertWithHeicConvert(inputPath);
    
    if (jpegBuffer) {
      // 2. Sharp로 썸네일 리사이즈
      console.log('[convertHeicToThumbnail] Sharp로 썸네일 리사이즈 :', `${size}x${size}`);
      const thumbnailBuffer = await sharp(jpegBuffer)
        .resize(size, size, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      console.log('[convertHeicToThumbnail] 썸네일 생성 완료 :', thumbnailBuffer.length, 'bytes');
      return thumbnailBuffer;
    }

    // 3. heic-convert 실패시 Sharp 직접 시도 (fallback)
    console.log('[convertHeicToThumbnail] Sharp로 직접 썸네일 시도 :', inputPath);
    const buffer = await sharp(inputPath)
      .resize(size, size, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    console.log('[convertHeicToThumbnail] Sharp 직접 썸네일 완료 :', buffer.length, 'bytes');
    return buffer;
  } catch (error) {
    console.error('[convertHeicToThumbnail] HEIC 썸네일 오류 :', error);
    return null;
  }
}
