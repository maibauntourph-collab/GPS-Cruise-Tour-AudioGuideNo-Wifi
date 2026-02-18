import { db } from "../db";
import { creatorEarnings, transactions, settlements, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * [회계부장 교수님의 금융 코딩 특강: 크리에이터 정산 시스템]
 * 
 * 안녕 미래의 개발자 여러분! 결제와 정산 시스템은 앱에서 가장 '돈'과 직결된 아주 예민한 부분이야.
 * 우리가 만든 이 `SettlementService`는 플랫폼과 크리에이터가 공생하는 '수익 배분 로직'을 담고 있단다.
 * 
 * 여기서 배울 수 있는 핵심 개발 포인트:
 * 1. DB 트랜잭션 (Transaction): '돈 계산'에서 중간에 멈추면 큰일나겠지? A라는 사람 돈은 빠졌는데 B에게 안 들어가면 안 되니까.
 *    그래서 `db.transaction`을 사용해서 모든 과정이 '동시에 성공하거나, 아예 실패하도록' 묶었어.
 * 2. SQL 원자적 업데이트 (sql``): `SQL + 500`처럼 DB 레벨에서 직접 더하기를 해서, 
 *    동시에 여러 결제가 이뤄져도 수치가 꼬이지 않게 보호하는 기술이야.
 * 3. 7:3 수익 배분: 플랫폼 비즈니스의 약속된 비즈니스 로직을 코드에 그대로 녹여냈단다.
 */
export class SettlementService {
    // 플랫폼의 수익 배분율! 70%는 크리에이터(생산자)에게, 30%는 플랫폼(우리)의 운영비로 사용해.
    private readonly CREATOR_SHARE = 0.7; // 70%
    private readonly PLATFORM_SHARE = 0.3; // 30%

    /**
     * 결제 완료 처리 (Process Payment)
     * 사용자가 Stripe 등으로 결제를 성공하면 호출되는 함수야.
     * 
     * @param userId 결제한 사용자 (관광객)
     * @param targetId 구매 대상 (명소/가이드 ID)
     * @param amount 결제 총액 (€ 또는 원)
     * @param providerData 외부 결제 시스템(Stripe 등)에서 넘어온 상세 데이터
     */
    async processPayment(userId: string, targetId: string, amount: number, providerData: any) {
        try {
            console.log(`[회계부장] 영수증 끊을게요! 결제액: ${amount}, 유저: ${userId}`);

            // [핵심] 트랜잭션 시작! 이 안에서 하나라도 실패하면 다시 없었던 일로 되돌려(Rollback).
            return await db.transaction(async (tx) => {

                // 1. 거래 내역(Transaction) 기록부 작성
                // 누가, 언제, 무엇을, 얼마나 샀는지 영구적으로 기록해야 나중에 분쟁이 없겠지?
                const [transaction] = await tx.insert(transactions).values({
                    userId,
                    targetId,
                    amount,
                    status: "completed", // 결제가 완료되었다는 상태값
                    providerData
                }).returning();

                // 2. 크리에이터에게 갈 몫(70%) 계산
                const creatorAmount = amount * this.CREATOR_SHARE;

                // 3. 크리에이터 지갑(Earnings) 업데이트
                // 이 결제와 연결된 크리에이터(작성자)가 누구인지 providerData에서 확인해서 수익금을 넣어줄 거야.
                const creatorId = providerData.creatorId || 'admin'; // 누구의 수익인지 식별

                const [existingEarnings] = await tx.select()
                    .from(creatorEarnings)
                    .where(eq(creatorEarnings.userId, creatorId));

                if (existingEarnings) {
                    // 이미 활동 중인 크리에이터라면 기존 잔액에 수익금을 더해줘 (SQL 원자적 업데이트 사용!)
                    await tx.update(creatorEarnings)
                        .set({
                            totalBalance: sql`${creatorEarnings.totalBalance} + ${creatorAmount}`, // 출금 가능한 현재 잔액
                            totalEarned: sql`${creatorEarnings.totalEarned} + ${creatorAmount}`,   // 지금까지 번 누적 총액
                            updatedAt: new Date()
                        })
                        .where(eq(creatorEarnings.userId, creatorId));
                } else {
                    // 우리 플랫폼에 처음 참여한 크리에이터라면 새로운 지갑(레코드)을 만들어줘.
                    await tx.insert(creatorEarnings).values({
                        userId: creatorId,
                        totalBalance: creatorAmount,
                        totalEarned: creatorAmount,
                        updatedAt: new Date()
                    });
                }

                console.log(`[회계부장] 장부 기입이 아주 깔끔하게 끝났습니다! 거래 ID: ${transaction.id}`);
                return transaction;
            });
        } catch (error) {
            // 돈 문제는 정말 조심해야 해! 에러가 나면 즉시 관리자에게 로그로 알리는 과정이 필수란다.
            console.error("[회계부장 긴급] 결제 처리 중 대형 사고 발생! (DB 롤백됨):", error);
            throw error;
        }
    }

    /**
     * 정산 실행 (Run Settlement)
     * 보통 한 달에 한 번, 크리에이터의 잔액을 0으로 만들고 실제 현금을 보내주는 과정이야.
     */
    async runSettlement(userId: string, period: string) {
        try {
            return await db.transaction(async (tx) => {
                // 1. 정산할 금액이 있는지 지갑 확인
                const [earnings] = await tx.select().from(creatorEarnings).where(eq(creatorEarnings.userId, userId));

                if (!earnings || earnings.totalBalance <= 0) {
                    throw new Error("[회계부장] 정산해줄 돈이 없는데요? 잔액이 0원입니다.");
                }

                const settleAmount = earnings.totalBalance;

                // 2. '정산 완료' 증명서 레코드 생성
                const [settlement] = await tx.insert(settlements).values({
                    userId,
                    amount: settleAmount,
                    period, // 예: "2024-02"
                    status: "processing", // 현재 입금 작업 중이라는 뜻
                    createdAt: new Date()
                }).returning();

                // 3. 지갑 잔액을 0으로 리셋 (돈을 실제로 보내줄 거니까!)
                await tx.update(creatorEarnings)
                    .set({
                        totalBalance: 0,
                        updatedAt: new Date()
                    })
                    .where(eq(creatorEarnings.userId, userId));

                console.log(`[회계부장] ${userId}님께 ${settleAmount}원만큼 송금 지시를 내렸습니다.`);
                return settlement;
            });
        } catch (error) {
            console.error("[회계부장] 정산 작업 중 문제 발생:", error);
            throw error;
        }
    }

    /**
     * 크리에이터 실적 대시보드 데이터 조회
     */
    async getCreatorStats(userId: string) {
        // 1. 현재 내 지갑 상태 (잔액, 총 수익) 가져오기
        const [earnings] = await db.select().from(creatorEarnings).where(eq(creatorEarnings.userId, userId));

        // 2. 최근 10개의 거래 내역만 정렬해서 보여주기 (최신순)
        const recentTransactions = await db.select().from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(sql`${transactions.createdAt} DESC`)
            .limit(10);

        return {
            totalBalance: Number(earnings?.totalBalance || 0),
            totalEarned: Number(earnings?.totalEarned || 0),
            visitorCount: 0, // [회계부장] 차후 가문 목록이나 트랜잭션 수로 실제 집계 로직 추가 예정
            recentTransactions
        };
    }
}

export const settlementService = new SettlementService();
