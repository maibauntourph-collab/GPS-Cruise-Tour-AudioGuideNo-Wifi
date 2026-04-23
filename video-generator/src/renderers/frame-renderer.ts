/**
 * Canvas 프레임 렌더러
 * node-canvas로 각 프레임을 PNG 버퍼로 생성
 */

import { createCanvas, loadImage, type Canvas, type SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas';
import type { FrameSpec } from '../templates/city-guide-shorts.js';
import { generateQRDataURL } from '../utils/qr-generator.js';

// 영상 규격
const WIDTH = 1080;
const HEIGHT = 1920;
const BRAND_COLOR = '#E85D36';
const DARK_BG = '#1A1A2E';

export class FrameRenderer {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, any> = new Map();

  constructor() {
    this.canvas = createCanvas(WIDTH, HEIGHT);
    this.ctx = this.canvas.getContext('2d');
  }

  async preloadImage(url: string): Promise<any> {
    if (this.imageCache.has(url)) return this.imageCache.get(url);
    try {
      const img = await loadImage(url);
      this.imageCache.set(url, img);
      return img;
    } catch (e) {
      console.warn(`[FrameRenderer] Failed to load image: ${url}`);
      return null;
    }
  }

  /**
   * 프레임 렌더링 메인 함수
   * @returns PNG Buffer
   */
  async renderFrame(spec: FrameSpec, frameNumber: number): Promise<Buffer> {
    const { ctx } = this;
    const progress = (frameNumber - spec.startFrame) / (spec.endFrame - spec.startFrame);

    // 캔버스 클리어
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    switch (spec.type) {
      case 'title':
        await this.renderTitleFrame(spec.data, progress);
        break;
      case 'landmark':
        await this.renderLandmarkFrame(spec.data, progress);
        break;
      case 'cta':
        await this.renderCTAFrame(spec.data, progress);
        break;
    }

    return this.canvas.toBuffer('image/png');
  }

  // ==================== 타이틀 프레임 ====================
  private async renderTitleFrame(data: any, progress: number) {
    const { ctx } = this;

    // 배경 이미지 + Ken Burns 줌인
    const img = await this.preloadImage(data.heroImage);
    if (img) {
      const scale = 1.0 + progress * 0.08; // 1.0 → 1.08
      this.drawImageCover(img, scale);
    } else {
      // 폴백: 그라디언트 배경
      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      grad.addColorStop(0, '#2D1B69');
      grad.addColorStop(1, DARK_BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // 하단 그라디언트 오버레이
    const overlay = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT);
    overlay.addColorStop(0, 'rgba(0,0,0,0)');
    overlay.addColorStop(0.7, 'rgba(0,0,0,0.7)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 도시 이름 (페이드인 + 슬라이드업)
    const fadeIn = Math.min(progress * 3, 1); // 0-33% 구간에서 완료
    const slideUp = (1 - fadeIn) * 60;

    ctx.globalAlpha = fadeIn;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(data.cityName, WIDTH / 2, 1280 + slideUp);

    // 국가명
    ctx.font = '36px sans-serif';
    ctx.globalAlpha = fadeIn * 0.8;
    ctx.fillText(data.country, WIDTH / 2, 1390 + slideUp);

    // 브랜드 텍스트
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = BRAND_COLOR;
    ctx.globalAlpha = Math.max(0, (progress - 0.3) * 3); // delay
    ctx.shadowBlur = 0;
    ctx.fillText(data.brandText, WIDTH / 2, 1680);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ==================== 랜드마크 프레임 ====================
  private async renderLandmarkFrame(data: any, progress: number) {
    const { ctx } = this;

    // 배경 이미지 + Ken Burns
    const img = await this.preloadImage(data.imageUrl);
    if (img) {
      const scale = 1.0 + progress * 0.05;
      this.drawImageCover(img, scale);
    } else {
      ctx.fillStyle = '#2C2C3A';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // 전체 어둡게 + 하단 그라디언트
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const bottomGrad = ctx.createLinearGradient(0, HEIGHT * 0.4, 0, HEIGHT);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 순번 뱃지
    const fadeIn = Math.min(progress * 4, 1);
    ctx.globalAlpha = fadeIn;

    // 원형 뱃지
    ctx.beginPath();
    ctx.arc(116, 1236, 36, 0, Math.PI * 2);
    ctx.fillStyle = BRAND_COLOR;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(data.index), 116, 1250);

    // 랜드마크 이름
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    const nameX = 172;
    ctx.fillText(data.name, nameX, 1250, 828);

    // 설명 (최대 2줄)
    ctx.font = '30px sans-serif';
    ctx.shadowBlur = 4;
    const lines = this.wrapText(data.description, 920);
    lines.slice(0, 2).forEach((line: string, i: number) => {
      ctx.fillText(line, 80, 1320 + i * 44);
    });

    // 거리 정보
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = BRAND_COLOR;
    ctx.shadowBlur = 0;
    ctx.fillText(`📍 ${data.distance}`, 80, 1430);

    // 프로그레스 도트
    ctx.textAlign = 'center';
    for (let i = 0; i < data.totalLandmarks; i++) {
      ctx.beginPath();
      const dotSize = (i + 1 === data.index) ? 6 : 4;
      ctx.arc(WIDTH / 2 + (i - 1) * 24, 1760, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = (i + 1 === data.index) ? BRAND_COLOR : 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ==================== CTA 프레임 ====================
  private async renderCTAFrame(data: any, progress: number) {
    const { ctx } = this;

    // 다크 그라디언트 배경
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, DARK_BG);
    grad.addColorStop(0.5, '#16213E');
    grad.addColorStop(1, '#0F3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 메인 카피 (스케일인)
    const scaleIn = Math.min(progress * 3, 1);
    ctx.globalAlpha = scaleIn;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px sans-serif';

    const lines = (data.mainText || '').split('\n');
    lines.forEach((line: string, i: number) => {
      // 마지막 줄은 브랜드 컬러
      ctx.fillStyle = (i === lines.length - 1) ? BRAND_COLOR : '#FFFFFF';
      ctx.fillText(line, WIDTH / 2, 550 + i * 80);
    });

    // QR 코드 — 실제 QR 이미지 렌더링
    const qrY = 900;
    const qrSize = 320;
    const qrUrl = data.url || 'https://nowifigps.tours';
    try {
      const qrDataUrl = await generateQRDataURL(qrUrl, qrSize);
      const qrImg = await loadImage(qrDataUrl);
      // 흰색 패딩 배경
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      this.roundRect(ctx, WIDTH / 2 - qrSize / 2 - 12, qrY - 12, qrSize + 24, qrSize + 24, 16);
      ctx.fill();
      // QR 이미지
      ctx.drawImage(qrImg, WIDTH / 2 - qrSize / 2, qrY, qrSize, qrSize);
    } catch {
      // 폴백: 플레이스홀더
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(WIDTH / 2 - 140, qrY, 280, 280);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(qrUrl, WIDTH / 2, qrY + 150);
    }

    // QR 안내
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(data.subText, WIDTH / 2, qrY + 330);

    // URL
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = BRAND_COLOR;
    ctx.fillText(data.url, WIDTH / 2, 1600);

    ctx.globalAlpha = 1;
  }

  // ==================== 유틸리티 ====================

  /** canvas roundRect 폴리필 */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** 이미지를 cover 모드로 그리기 (Ken Burns scale 적용) */
  private drawImageCover(img: any, scale: number = 1.0) {
    const { ctx } = this;
    const imgRatio = img.width / img.height;
    const canvasRatio = WIDTH / HEIGHT;

    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgRatio > canvasRatio) {
      // 이미지가 더 넓음 → 좌우 크롭
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      // 이미지가 더 높음 → 상하 크롭
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }

    // Ken Burns: scale 적용
    const scaledW = WIDTH * scale;
    const scaledH = HEIGHT * scale;
    const offsetX = (WIDTH - scaledW) / 2;
    const offsetY = (HEIGHT - scaledH) / 2;

    ctx.drawImage(img, sx, sy, sw, sh, offsetX, offsetY, scaledW, scaledH);
  }

  /** 텍스트 줄바꿈 */
  private wrapText(text: string | undefined | null, maxWidth: number): string[] {
    if (!text) return [''];
    const { ctx } = this;
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }
}
