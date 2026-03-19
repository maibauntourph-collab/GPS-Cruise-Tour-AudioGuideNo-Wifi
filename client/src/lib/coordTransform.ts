/**
 * [어벤져스 팀 | 2026-03-20] 🗺️ 좌표 변환 유틸리티 (WGS-84 <-> GCJ-02)
 * 중국의 Amap(高德地图), Baidu Maps 등은 국가 보안을 이유로 GCJ-02(화성 좌표계)를 사용합니다.
 * 표준 GPS(WGS-84) 좌표를 Amap에 표시하면 약 500m 내외의 오차가 발생하므로 변환이 필수입니다.
 * 
 * [적요] 대학생들도 이해할 수 있도록 주석을 상세히 남깁니다.
 */

const PI = 3.1415926535897932384626;
const A = 6378245.0; // 지구의 장반경 (WGS84 기준)
const EE = 0.00669342162296594323; // 제1이심률의 제곱

/**
 * 위도 변환 함수
 */
function transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

/**
 * 경도 변환 함수
 */
function transformLng(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}

/**
 * 중국 영토 외부인지 확인 (중국 외부라면 변환 불필요)
 */
export function outOfChina(lat: number, lng: number): boolean {
    if (lng < 72.004 || lng > 135.05) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
}

/**
 * WGS-84 (표준 GPS) -> GCJ-02 (Amap/화성 좌표)
 */
export function wgs84ToGcj02(lat: number, lng: number): [number, number] {
    if (outOfChina(lat, lng)) {
        return [lat, lng];
    }
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);
    let radLat = lat / 180.0 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    let sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
    const mLat = lat + dLat;
    const mLng = lng + dLng;
    return [mLat, mLng];
}

/**
 * GCJ-02 -> WGS-84 (역변환)
 */
export function gcj02ToWgs84(lat: number, lng: number): [number, number] {
    if (outOfChina(lat, lng)) {
        return [lat, lng];
    }
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);
    let radLat = lat / 180.0 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    let sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
    const mLat = lat + dLat;
    const mLng = lng + dLng;
    return [lat * 2 - mLat, lng * 2 - mLng];
}
