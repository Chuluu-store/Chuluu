import { readFile } from 'fs/promises';
import ExifReaderLib from 'exifreader';

// 파일에서 직접 EXIF 읽기 (fs 사용 - EXIF 정보 보존)
export async function parseExifFromFile(filePath: string): Promise<any> {
  try {
    // fs로 원본 파일 읽기 (EXIF 정보 보존)
    const fileBuffer = await readFile(filePath);
    console.log('[parseExifFromFile] EXIF 파일 읽기 시작 :', filePath, `(${fileBuffer.length} bytes)`);

    // ExifReader 사용 (가장 정확한 EXIF 파싱)
    try {
      const tags = await ExifReaderLib.load(fileBuffer);
      console.log('[parseExifFromFile] ExifReader 태그 발견 :', Object.keys(tags).length, '개');

      // GPS 정보 추출
      let gpsData = null;
      if (tags['GPSLatitude'] && tags['GPSLongitude']) {
        // GPS 좌표 변환
        const latValue = tags['GPSLatitude'].description || convertGPSCoordinate(tags['GPSLatitude'].value);
        const lonValue = tags['GPSLongitude'].description || convertGPSCoordinate(tags['GPSLongitude'].value);

        gpsData = {
          latitude: latValue,
          longitude: lonValue,
          altitude: tags['GPSAltitude']?.description || tags['GPSAltitude']?.value,
          latitudeRef: tags['GPSLatitudeRef']?.description,
          longitudeRef: tags['GPSLongitudeRef']?.description,
        };
        console.log('[parseExifFromFile] GPS 데이터 발견 :', gpsData);
      }

      return {
        // 카메라 정보
        make: tags['Make']?.description || tags['Make']?.value,
        model: tags['Model']?.description || tags['Model']?.value,

        // 날짜 정보 (description이 더 정확함)
        dateTimeOriginal: tags['DateTimeOriginal']?.description || tags['DateTime']?.description,
        createDate: tags['CreateDate']?.description || tags['DateTimeDigitized']?.description,
        modifyDate: tags['ModifyDate']?.description,

        // 이미지 크기
        imageWidth: tags['Image Width']?.value || tags['ImageWidth']?.value || tags['PixelXDimension']?.value,
        imageHeight: tags['Image Height']?.value || tags['ImageHeight']?.value || tags['PixelYDimension']?.value,

        // 촬영 설정 (ISOSpeedRatings는 EXIF 표준 태그명)
        iso: tags['ISOSpeedRatings']?.value || tags['ISO']?.value || tags['ISOSpeedRatings']?.description,
        fNumber: tags['FNumber']?.value || tags['FNumber']?.description || tags['ApertureValue']?.value,
        exposureTime: tags['ExposureTime']?.description || tags['ExposureTime']?.value,
        focalLength: tags['FocalLength']?.value || tags['FocalLength']?.description,
        focalLengthIn35mm: tags['FocalLengthIn35mmFilm']?.value || tags['FocalLengthIn35mmFilm']?.description,
        orientation: tags['Orientation']?.value || tags['Orientation']?.description,

        // GPS
        gps: gpsData,

        // 기타 정보
        software: tags['Software']?.description,
        lensModel: tags['LensModel']?.description || tags['LensMake']?.description,
        whiteBalance: tags['WhiteBalance']?.description,
        flash: tags['Flash']?.description,

        // 원본 태그 (디버깅용)
        allTags: Object.keys(tags).reduce((acc: any, key) => {
          acc[key] = tags[key].description || tags[key].value;
          return acc;
        }, {}),
      };
    } catch (exifReaderError) {
      console.error('[parseExifFromFile] ExifReader 실패 :', exifReaderError);
      return null;
    }
  } catch (error) {
    console.error('[parseExifFromFile] EXIF 파싱 실패 :', error);
    return null;
  }
}

// GPS 좌표 변환 (도분초 → 십진법)
function convertGPSCoordinate(value: any): number | null {
  if (!value || !Array.isArray(value) || value.length !== 3) return null;

  try {
    const degrees = value[0];
    const minutes = value[1];
    const seconds = value[2];

    return degrees + minutes / 60 + seconds / 3600;
  } catch (error) {
    return null;
  }
}

// EXIF 버퍼에서 데이터 파싱
export function parseExifFromBuffer(buffer: Buffer): any {
  try {
    // ExifReader 먼저 시도
    const tags = ExifReaderLib.load(buffer);

    let gpsData = null;
    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
      gpsData = {
        latitude: tags['GPSLatitude'].description || convertGPSCoordinate(tags['GPSLatitude'].value),
        longitude: tags['GPSLongitude'].description || convertGPSCoordinate(tags['GPSLongitude'].value),
      };
    }

    return {
      make: tags['Make']?.description || tags['Make']?.value,
      model: tags['Model']?.description || tags['Model']?.value,
      dateTimeOriginal: tags['DateTimeOriginal']?.description,
      createDate: tags['CreateDate']?.description,
      iso: tags['ISOSpeedRatings']?.value || tags['ISO']?.value,
      fNumber: tags['FNumber']?.value,
      exposureTime: tags['ExposureTime']?.description,
      focalLength: tags['FocalLength']?.value,
      imageWidth: tags['ImageWidth']?.value || tags['PixelXDimension']?.value,
      imageHeight: tags['ImageHeight']?.value || tags['PixelYDimension']?.value,
      gps: gpsData,
      orientation: tags['Orientation']?.value,
    };
  } catch (error) {
    console.error('[parseExifFromBuffer] EXIF 파싱 실패 :', error);
    return null;
  }
}

// HEIC EXIF 버퍼 파싱 (Sharp에서 추출한 버퍼용)
export function parseHeicExifBuffer(exifBuffer: Buffer): any {
  try {
    // EXIF 헤더 확인
    const header = exifBuffer.toString('ascii', 0, 4);

    if (header === 'Exif') {
      // Exif 헤더가 있으면 제거하고 파싱
      const actualExif = exifBuffer.slice(6); // "Exif\x00\x00" 제거
      return parseExifFromBuffer(actualExif);
    } else if (header === 'MM\x00\x2a' || header === 'II\x2a\x00') {
      // TIFF 헤더가 있으면 직접 파싱
      return parseExifFromBuffer(exifBuffer);
    } else {
      // 헤더가 없으면 직접 파싱 시도
      return parseExifFromBuffer(exifBuffer);
    }
  } catch (error) {
    console.log('[parseHeicExifBuffer] HEIC EXIF 파싱 실패 :', error);
    return null;
  }
}

// 날짜 문자열 파싱
export function parseExifDate(dateStr: any): Date | null {
  if (!dateStr) return null;

  try {
    // EXIF 날짜 형식: "YYYY:MM:DD HH:mm:ss"
    if (typeof dateStr === 'string') {
      // 콜론을 하이픈으로 변경
      if (dateStr.includes(':')) {
        const parsed = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
        const date = new Date(parsed);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // ISO 형식 시도
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Unix timestamp
    if (typeof dateStr === 'number') {
      const date = new Date(dateStr * 1000);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  } catch (e) {
    console.log('[parseExifDate] 날짜 파싱 실패 :', dateStr);
  }

  return null;
}

// 메타데이터 정규화
export function normalizeMetadata(metadata: any): any {
  if (!metadata) return {};

  // exif 객체가 있으면 먼저 추출
  const exifData = metadata?.exif || metadata;

  return {
    // 크기
    width:
      metadata?.imageWidth ||
      metadata?.ImageWidth ||
      metadata?.PixelXDimension ||
      metadata?.width ||
      exifData?.PixelXDimension,
    height:
      metadata?.imageHeight ||
      metadata?.ImageHeight ||
      metadata?.PixelYDimension ||
      metadata?.height ||
      exifData?.PixelYDimension,

    // 카메라 정보 - MOV 파일도 카메라 정보 표시되도록
    cameraMake: metadata?.make || metadata?.Make || metadata?.cameraMake || exifData?.Make,
    cameraModel: metadata?.model || metadata?.Model || metadata?.cameraModel || exifData?.Model,

    // 날짜
    takenAt: parseExifDate(
      metadata?.dateTimeOriginal ||
        metadata?.DateTimeOriginal ||
        metadata?.takenAt ||
        exifData?.DateTimeOriginal ||
        metadata?.createDate ||
        metadata?.CreateDate ||
        metadata?.modifyDate ||
        metadata?.ModifyDate
    ),

    // 촬영 설정 - EXIF 객체에서도 추출
    iso: metadata?.iso || metadata?.ISO || metadata?.ISOSpeedRatings || exifData?.ISOSpeedRatings || exifData?.ISO,
    fNumber:
      metadata?.fNumber ||
      metadata?.FNumber ||
      metadata?.ApertureValue ||
      exifData?.FNumber ||
      parseFloat(exifData?.FNumber?.replace?.('f/', '')),
    exposureTime:
      metadata?.exposureTime || metadata?.ExposureTime || metadata?.ShutterSpeedValue || exifData?.ExposureTime,
    focalLength:
      metadata?.focalLength ||
      metadata?.FocalLength ||
      exifData?.FocalLength ||
      parseFloat(exifData?.FocalLength?.replace?.(' mm', '')),
    focalLengthIn35mm:
      metadata?.focalLengthIn35mm ||
      metadata?.FocalLengthIn35mmFilm ||
      exifData?.FocalLengthIn35mmFilm ||
      parseFloat(exifData?.FocalLengthIn35mmFilm?.replace?.(' mm', '')),
    orientation: metadata?.orientation || metadata?.Orientation || exifData?.Orientation,

    // GPS - gps 객체도 location으로 매핑
    location:
      metadata?.gps ||
      metadata?.location ||
      (metadata?.gps?.latitude && metadata?.gps?.longitude
        ? {
            latitude: metadata.gps.latitude,
            longitude: metadata.gps.longitude,
            altitude: metadata.gps.altitude,
          }
        : null) ||
      (exifData?.GPSLatitude && exifData?.GPSLongitude
        ? {
            latitude: typeof exifData.GPSLatitude === 'number' ? exifData.GPSLatitude : metadata?.GPSLatitude,
            longitude: typeof exifData.GPSLongitude === 'number' ? exifData.GPSLongitude : metadata?.GPSLongitude,
            altitude: exifData?.GPSAltitude,
          }
        : null),

    // 기타
    software: metadata?.software || metadata?.Software || exifData?.Software,
    lensModel: metadata?.lensModel || metadata?.LensModel || exifData?.LensModel,
    
    // 비디오 관련 (MOV 파일용)
    duration: metadata?.duration || metadata?.Duration || exifData?.Duration,
    bitrate: metadata?.bitrate || metadata?.Bitrate || exifData?.Bitrate,
    codec: metadata?.codec || metadata?.Codec || exifData?.Codec,

    // 원본 데이터 (선택적)
    exif: metadata?.allTags || exifData,
  };
}
