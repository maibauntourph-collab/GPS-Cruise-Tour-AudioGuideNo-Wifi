/**
 * [연구소장 가이드] QR 코드 생성 유틸리티
 * 학생 여러분, 배지 획득을 위한 동적 QR 코드를 생성하거나 
 * B2B 온보딩을 위한 짧은 URL 구조를 파싱하는 함수들을 모았습니다.
 */

export interface QRData {
    type: 'badge' | 'onboarding' | 'share';
    id: string;
    cityId?: string;
    routeId?: string;
    token?: string;
}

/**
 * 배지 획득을 위한 QR 데이터 생성
 */
export function generateBadgeQRData(landmarkId: string): string {
    const data: QRData = {
        type: 'badge',
        id: landmarkId
    };
    return JSON.stringify(data);
}

/**
 * 온보딩(Deep-link)을 위한 QR 데이터 생성
 */
export function generateOnboardingQRData(cityId: string, routeId?: string): string {
    const data: QRData = {
        type: 'onboarding',
        id: cityId,
        cityId,
        routeId
    };
    return JSON.stringify(data);
}

/**
 * QR 문자열 데이터를 객체로 파싱
 */
export function parseQRData(qrString: string): QRData | null {
    try {
        // JSON 형태인 경우
        if (qrString.startsWith('{')) {
            return JSON.parse(qrString);
        }

        // URL 형태인 경우 (예: /rome/Best3?token=...)
        const url = new URL(qrString, window.location.origin);
        const pathParts = url.pathname.split('/').filter(Boolean);

        if (pathParts.length >= 1) {
            return {
                type: 'onboarding',
                id: pathParts[0],
                cityId: pathParts[0],
                routeId: pathParts[1],
                token: url.searchParams.get('token') || undefined
            };
        }
    } catch (e) {
        console.error('Failed to parse QR data:', e);
    }
    return null;
}
