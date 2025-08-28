declare module 'exif-parser' {
  interface ExifData {
    tags?: {
      [key: string]: any;
      DateTime?: string;
      DateTimeOriginal?: string;
      DateTimeDigitized?: string;
      Make?: string;
      Model?: string;
      ISO?: number;
      FNumber?: number;
      ExposureTime?: number;
      FocalLength?: number;
      GPSLatitude?: number;
      GPSLongitude?: number;
      PixelXDimension?: number;
      PixelYDimension?: number;
      ImageWidth?: number;
      ImageHeight?: number;
      ExifImageWidth?: number;
      ExifImageHeight?: number;
    };
    imageSize?: {
      width: number;
      height: number;
    };
  }

  interface ExifParser {
    parse(): ExifData;
    enableSimpleValues(enable: boolean): ExifParser;
    enableTagNames(enable: boolean): ExifParser;
    enableImageSize(enable: boolean): ExifParser;
    enableReturnTags(enable: boolean): ExifParser;
  }

  function create(buffer: Buffer): ExifParser;
  
  export = {
    create
  };
}

declare module 'piexifjs' {
  interface ExifDict {
    [key: string]: any;
  }

  interface ExifData {
    '0th'?: ExifDict;
    '1st'?: ExifDict;
    Exif?: ExifDict;
    GPS?: ExifDict;
    Interop?: ExifDict;
    thumbnail?: string;
  }

  export function load(jpegData: string | ArrayBuffer): ExifData;
  export function dump(exifDict: ExifData): string;
  export function insert(exif: string, jpegData: string): string;
  export function remove(jpegData: string): string;
  export function transplant(exifStr: string, newJpeg: string): string;
  
  export const TAGS: {
    Image: { [key: number]: string };
    Exif: { [key: number]: string };
    GPS: { [key: number]: string };
    Iop: { [key: number]: string };
  };
}