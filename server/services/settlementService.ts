// [학습 권고: 비즈니스 로직의 심장 - Accounting Manager]
// 1. 수익 분배: 실 결제액의 20%를 파트너(가이드/승무원)의 몫으로 계산합니다.
// 2. 데이터 무결성: 결제가 'completed' 상태인 경우에만 정산 로직이 실행되도록 가드(Guard)를 둡니다.
// 3. 지갑 시스템: 각 유저별 creator_earnings 테이블을 업데이트하여 실시간 수익 현황을 관리합니다.
// 4. 낙전 수익: 유효기간이 지난 크레딧을 처리하는 배치 프로세스의 기반을 마련합니다.

import { db } from "../db";
import { transactions, creatorEarnings, users } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * [회계 관리자 노트: 파트너 정산 서비스]
 * 본 서비스는 결제 완료 시 파트너(가이드/승무원)에게 리워드를 적립하는 핵심 비즈니스 로직입니다.
 */
export class SettlementService {

    /**
     * [적요] 파트너 수익 배분 처리
     * 결제 트랜잭션을 분석하여 정해진 비율(20%)만큼 파트너의 지갑에 수익을 누적시킵니다.
     */
    static async processPartnerReward(transactionId: string) {
        console.log(`💰 [Accounting Manager] 결제 건에 대한 수익 정산을 시작합니다: ${transactionId}`);

        const tx = await db.query.transactions.findFirst({
            where: eq(transactions.id, transactionId)
        });

        if (!tx || tx.status !== 'completed') {
            console.error("❌ 완료되지 않은 결제 건이거나 존재하지 않는 트랜잭션입니다.");
            return;
        }

        // [적요] 실 결제액 추출: 할인 등을 제외하고 실제 결제된 금액(Net Revenue)을 기준으로 합니다.
        const netRevenue = tx.amount;

        // [적요] 리워드 계산: 비즈니스 정책에 따라 실 결제액의 20%를 분배합니다.
        const partnerReward = netRevenue * 0.2;

        console.log(`🎯 실 결제액: ${netRevenue}, 파트너 리워드(20%): ${partnerReward}`);

        // [적요] 지갑 업데이트: Drizzle ORM의 sql 템플릿을 사용하여 원자적(Atomic)으로 금액을 증가시킵니다.
        // 이는 데이터 동시성 문제를 방지하는 중요한 기법입니다.
        await db.update(creatorEarnings)
            .set({
                totalBalance: sql`${creatorEarnings.totalBalance} + ${partnerReward}`,
                totalEarned: sql`${creatorEarnings.totalEarned} + ${partnerReward}`,
                updatedAt: new Date()
            })
            .where(eq(creatorEarnings.userId, tx.userId));

        console.log(`✅ 파트너 지갑에 ${partnerReward}원이 성공적으로 적립되었습니다.`);
    }

    /**
     * [적요] 크레딧 소멸 로직
     * 사용자가 여행 종료 후 일정 기간(예: 1년) 동안 사용하지 않은 크레딧을 회사의 낙전수익으로 확정 처리합니다.
     */
    static async expireCredits() {
        console.log("💳 [Accounting Manager] 크레딧 만료 배치 작업을 수행 중...");
        // 추후 구현 예정: 유효기간 체크 및 잔액 조정 로직
    }
}
