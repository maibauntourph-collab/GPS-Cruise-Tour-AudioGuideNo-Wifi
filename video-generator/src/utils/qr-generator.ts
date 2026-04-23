/**
 * QR 코드 생성 유틸리티
 * qrcode 패키지로 URL → PNG DataURL 생성
 *
 * 설치: npm install qrcode @types/qrcode
 */

import QRCode from 'qrcode';

/**
 * URL을 QR 코드 PNG DataURL로 변환
 * @param url  QR 코드에 담을 URL
 * @param size 픽셀 크기 (기본 320)
 * @returns    data:image/png;base64,... 형태의 DataURL
 */
export async function generateQRDataURL(url: string, size: number = 320): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: '#000000',   // QR 모듈 색상
      light: '#FFFFFF',  // 배경 색상
    },
    errorCorrectionLevel: 'H',  // 최고 오류 복원력 (로고 삽입 시 필요)
  });
}
