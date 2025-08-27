import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * macOS의 sips 명령어를 사용하여 HEIC를 JPEG로 변환
 */
async function convertWithSips(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    // macOS의 sips 명령어 사용
    const command = `sips -s format jpeg "${inputPath}" --out "${outputPath}" --setProperty formatOptions 90`;
    await execAsync(command);
    return existsSync(outputPath);
  } catch (error) {
    console.error('sips conversion failed:', error);
    return false;
  }
}

/**
 * ImageMagick을 사용하여 HEIC를 JPEG로 변환
 */
async function convertWithImageMagick(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    const command = `convert "${inputPath}" -quality 90 "${outputPath}"`;
    await execAsync(command);
    return existsSync(outputPath);
  } catch (error) {
    console.error('ImageMagick conversion failed:', error);
    return false;
  }
}

/**
 * HEIC 파일을 JPEG로 변환
 */
export async function convertHeicToJpeg(inputPath: string): Promise<Buffer | null> {
  if (!existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    return null;
  }

  // 임시 출력 경로 생성
  const tempDir = path.join(os.tmpdir(), 'heic-conversion');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const outputPath = path.join(tempDir, `${Date.now()}_converted.jpg`);

  try {
    let converted = false;

    // macOS인 경우 sips 시도
    if (process.platform === 'darwin') {
      console.log('Attempting HEIC conversion with sips...');
      converted = await convertWithSips(inputPath, outputPath);
    }

    // sips 실패 시 ImageMagick 시도
    if (!converted) {
      console.log('Attempting HEIC conversion with ImageMagick...');
      converted = await convertWithImageMagick(inputPath, outputPath);
    }

    // 변환 성공 시 버퍼 반환
    if (converted && existsSync(outputPath)) {
      const buffer = await readFile(outputPath);
      
      // 임시 파일 삭제
      try {
        const fs = await import('fs/promises');
        await fs.unlink(outputPath);
      } catch (e) {
        // 삭제 실패 무시
      }
      
      console.log('✅ HEIC conversion successful');
      return buffer;
    }

    console.error('❌ All HEIC conversion methods failed');
    return null;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return null;
  }
}

/**
 * HEIC 파일을 JPEG 썸네일로 변환
 */
export async function convertHeicToThumbnail(inputPath: string, size: number = 300): Promise<Buffer | null> {
  if (!existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    return null;
  }

  const tempDir = path.join(os.tmpdir(), 'heic-thumbnails');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const outputPath = path.join(tempDir, `${Date.now()}_thumb.jpg`);

  try {
    let converted = false;

    if (process.platform === 'darwin') {
      // macOS sips로 썸네일 생성
      const command = `sips -s format jpeg "${inputPath}" --resampleHeightWidth ${size} ${size} --out "${outputPath}" --setProperty formatOptions 85`;
      try {
        await execAsync(command);
        converted = existsSync(outputPath);
      } catch (error) {
        console.error('sips thumbnail failed:', error);
      }
    }

    if (!converted) {
      // ImageMagick으로 썸네일 생성
      const command = `convert "${inputPath}" -thumbnail ${size}x${size} -quality 85 "${outputPath}"`;
      try {
        await execAsync(command);
        converted = existsSync(outputPath);
      } catch (error) {
        console.error('ImageMagick thumbnail failed:', error);
      }
    }

    if (converted && existsSync(outputPath)) {
      const buffer = await readFile(outputPath);
      
      // 임시 파일 삭제
      try {
        const fs = await import('fs/promises');
        await fs.unlink(outputPath);
      } catch (e) {
        // 삭제 실패 무시
      }
      
      return buffer;
    }

    return null;
  } catch (error) {
    console.error('HEIC thumbnail error:', error);
    return null;
  }
}