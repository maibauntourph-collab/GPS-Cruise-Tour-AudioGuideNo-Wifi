import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// 파일명 정의 (V2: 제휴 수수료 및 운영비 반영)
const fileName = `2026-03-27_GPS_TOURS_Simulation_v2_Affiliate.xlsx`;
const filePath = path.join(process.cwd(), fileName);

// 1. Settings 시트 (실질 제휴 수익 및 운영비 정의)
const settingsData = [
    ['Category', 'Platform/Type', 'Total Commission (AR)', 'OpEx % (of AR)', 'Sales Pool % (of AR)', 'Net Profit % (of AR)'],
    ['Affiliate', 'GetYourGuide', 0.07, 0.20, 0.65, 0.15],
    ['Affiliate', 'Trip.com', 0.05, 0.25, 0.60, 0.15],
    ['Affiliate', 'Coupang (Life)', 0.03, 0.30, 0.50, 0.20],
    ['Own Product', 'GPS Premium Pkg', 0.25, 0.15, 0.65, 0.20],
    ['', '', '', '', '', ''],
    ['Sales Pool Allocation (By Level)', 'L1', 'L2 (OR)', 'L3 (OR)', 'L4 (Sup)', 'L5 (Sup)'],
    ['Allocation % of Pool', 0.55, 0.15, 0.12, 0.10, 0.08]
];

// 2. Simulation 시트 (수익 배분 로직)
const simData = [
    ['Rank', 'Level', 'Monthly Sales (KRW)', 'Total Comm (Gross)', 'OpEx Cost (Co)', 'Net Profit (Co)', 'Total Sales Reward (Pool)', 'L1 Direct', 'Overriding (Team)'],
    ['L1', 'Adviser', 15000000, 1050000, 210000, 157500, 682500, 375375, 0],
    ['L2', 'Senior', 50000000, 3500000, 700000, 525000, 2275000, 375375, 125125],
    ['L3', 'Manager', 200000000, 14000000, 2800000, 2100000, 9100000, 450000, 1092000],
    ['L4', 'Director', 500000000, 35000000, 7000000, 5250000, 22750000, 500000, 2275000],
    ['L5', 'VP', 2000000000, 140000000, 28000000, 21000000, 91000000, 600000, 7280000]
];

// 3. Guide/Escort 시트 (동일 유지 가능 혹은 추가 분석)
const guideData = [
    ['Activity', 'Base Income', 'Days', 'Bonus/Option', 'Total Field Income'],
    ['Local Guide', 200000, 4, 100000, 900000],
    ['Tour Escort (TC)', 150000, 4, 50000, 650000]
];

const wb = XLSX.utils.book_new();
const wsSettings = XLSX.utils.aoa_to_sheet(settingsData);
const wsSim = XLSX.utils.aoa_to_sheet(simData);
const wsGuide = XLSX.utils.aoa_to_sheet(guideData);

XLSX.utils.book_append_sheet(wb, wsSettings, 'BusinessModel');
XLSX.utils.book_append_sheet(wb, wsSim, 'ProfitSimulation');
XLSX.utils.book_append_sheet(wb, wsGuide, 'FieldWork');

XLSX.writeFile(wb, filePath);
console.log(`Excel V2 created: ${filePath}`);
