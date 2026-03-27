import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// 파일명 정의 (날짜 포함)
const fileName = `2026-03-27_GPS_TOURS_Simulation_v1.xlsx`;
const filePath = path.join(process.cwd(), fileName);

// 1. Settings 시트 데이터
const settingsData = [
    ['Variable', 'Value', 'Unit', 'Description'],
    ['Cruise Price', 1500000, 'KRW', '크루즈 여행 평균 단가'],
    ['Tour Price', 300000, 'KRW', '일반 패키지 여행 평균 단가'],
    ['Restaurant Price', 100000, 'KRW', '레스토랑 부킹 매출 기여분'],
    ['Retail Price', 50000, 'KRW', '쿠팡 등 생활용품 평균 구매액'],
    ['', '', '', ''],
    ['Level', 'Direct Comm %', 'Overriding %', 'Role'],
    ['L1 Advisory', 0.08, 0, '신규/개인판매'],
    ['L2 Senior', 0.10, 0.02, '팀빌딩 초기'],
    ['L3 Manager', 0.12, 0.03, '팀 관리자'],
    ['L4 Director', 0.14, 0.04, '본부 운영'],
    ['L5 VP', 0.15, 0.05, '총괄 경영'],
    ['', '', '', ''],
    ['Guide Day Rate', 200000, 'KRW', '현지 가이드 일당'],
    ['Escort Day Rate', 150000, 'KRW', '인솔자(TC) 일당']
];

// 2. Simulation 시트 데이터 (수식 포함)
// 수식은 Excel 내에서 셀 참조로 동작하도록 하거나, JS 상에서 결과를 계산하여 넣을 수 있습니다.
const simData = [
    ['Tier', 'Level', 'Direct Qty (Cruise)', 'Direct Income', 'Team Qty', 'Team Income', 'Guide Days', 'Escort Days', 'Total Income'],
    ['L1', 'Adviser', 2, 240000, 0, 0, 4, 0, '=(D2+F2+(G2*200000)+(H2*150000))'],
    ['L2', 'Senior', 3, 450000, 10, 300000, 4, 4, '=(D3+F3+(G3*200000)+(H3*150000))'],
    ['L3', 'Manager', 5, 900000, 50, 2250000, 8, 4, '=(D4+F4+(G4*200000)+(H4*150000))'],
    ['L4', 'Director', 3, 630000, 200, 12000000, 0, 0, '=(D5+F5+(G5*200000)+(H5*150000))'],
    ['L5', 'VP', 1, 225000, 1000, 75000000, 0, 0, '=(D6+F6+(G6*200000)+(H6*150000))']
];

// 3. Guide/Escort 상세 분석 시트
const guideData = [
    ['Activity', 'Type', 'Daily Rate', 'Days', 'Option Comm %', 'Est. Option Sales', 'Final Sum'],
    ['Cruise Tour', 'Guide', 200000, 4, 0.05, 500000, '=((C2*D2)+(E2*F2))'],
    ['Tokyo City', 'Escort', 150000, 3, 0.02, 200000, '=((C3*D3)+(E3*F3))'],
    ['Europe Pkg', 'Guide', 250000, 10, 0.07, 2000000, '=((C4*D4)+(E4*F4))']
];

const wb = XLSX.utils.book_new();

const wsSettings = XLSX.utils.aoa_to_sheet(settingsData);
const wsSim = XLSX.utils.aoa_to_sheet(simData);
const wsGuide = XLSX.utils.aoa_to_sheet(guideData);

XLSX.utils.book_append_sheet(wb, wsSettings, 'Settings');
XLSX.utils.book_append_sheet(wb, wsSim, 'Simulation');
XLSX.utils.book_append_sheet(wb, wsGuide, 'Guide_Escort');

XLSX.writeFile(wb, filePath);

console.log(`Excel file created: ${filePath}`);
