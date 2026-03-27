import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// 파일명 정의 (V3: 구독료 수익 및 고정비 상쇄 모델)
const fileName = `2026-03-27_GPS_TOURS_Simulation_v3_Subscription.xlsx`;
const filePath = path.join(process.cwd(), fileName);

// 1. BusinessModel 시트 (제휴 수수료 + 구독료 정의)
const settingsData = [
    ['Category', 'Platform/Type', 'Revenue/Fee', 'OpEx %', 'Sales Pool %', 'Net Profit %'],
    ['Affiliate', 'GetYourGuide', 0.07, 0.20, 0.65, 0.15],
    ['Affiliate', 'Trip.com', 0.05, 0.25, 0.60, 0.15],
    ['Membership', 'Basic (L1-L2)', 9900, 0.30, 0.00, 0.70],
    ['Membership', 'Pro (L3-L5)', 33000, 0.20, 0.00, 0.80],
    ['', '', '', '', '', ''],
    ['Subscription Target', 'Count', 'Monthly Revenue', 'Annual Revenue', '', ''],
    ['Basic Agents', 800, '=B7*C4', '=C7*12', '', ''],
    ['Pro Agents', 200, '=B8*C5', '=C8*12', '', ''],
    ['Total Subscription', '', '=C7+C8', '=D7+D8', '', '']
];

// 2. ProfitSimulation 시트 (구독료 수익 포함)
const simData = [
    ['Rank', 'Level', 'Sales/Head', 'Sales Revenue', 'Affiliate Reward', 'Sub. Revenue (Agent)', 'Total Co. OpEx', 'Total Co. Net Profit', 'Agent Net Income'],
    ['L1', 'Adviser', 15000000, 15000000, 682500, 9900, 212970, 164430, 932400],
    ['L2', 'Senior', 50000000, 50000000, 2275000, 9900, 702970, 531930, 2450000],
    ['L3', 'Manager', 200000000, 200000000, 9100000, 33000, 2806600, 2126400, 4850000],
    ['L4', 'Director', 500000000, 500000000, 22750000, 33000, 7006600, 5276400, 25056000],
    ['L5', 'VP', 2000000000, 2000000000, 91000000, 33000, 28006600, 21026400, 98313000]
];

// 3. Subscription_Logic 시트 (상세 설명)
const logicData = [
    ['Feature', 'Basic (9,900)', 'Pro (33,000)', 'ROI for Agent'],
    ['Audio Guide', 'Unlimited', 'Unlimited', '1 Tour = 49,000 worth'],
    ['Dashboard', 'Basic', 'Advanced (Team)', 'CRM tools worth 50k'],
    ['Marketing URL', 'Yes', 'Custom & Analytics', 'Lead-gen value high'],
    ['Training', 'Basic', 'Monthly Coaching', 'Expert growth'],
    ['Break-even', '1 Tour Sale', '2 Tour Sales', 'Very High']
];

const wb = XLSX.utils.book_new();
const wsSettings = XLSX.utils.aoa_to_sheet(settingsData);
const wsSim = XLSX.utils.aoa_to_sheet(simData);
const wsLogic = XLSX.utils.aoa_to_sheet(logicData);

XLSX.utils.book_append_sheet(wb, wsSettings, 'BusinessModel');
XLSX.utils.book_append_sheet(wb, wsSim, 'ProfitSimulation');
XLSX.utils.book_append_sheet(wb, wsLogic, 'SubBenefits');

XLSX.writeFile(wb, filePath);
console.log(`Excel V3 created: ${filePath}`);
