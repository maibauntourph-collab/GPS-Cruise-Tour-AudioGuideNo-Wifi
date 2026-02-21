import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Users, TrendingUp, ArrowDownToLine, CheckCircle2, Rocket, Globe, Zap, ShieldCheck, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * [강의 노트: 크리에이터 대시보드 인터페이스]
 * 학생 여러분, UI는 단순한 그림이 아니라 '데이터의 시각화'입니다.
 * 크리에이터는 자신의 노력이 어떻게 수익으로 이어지는지 알고 싶어 합니다.
 * 이 대시보드는 서버에서 가져온 금융 데이터를 사용자 친화적으로 보여주는 역할을 하죠.
 */
export default function CreatorDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    /**
     * [학습 포인트: API 연동과 상태 관리]
     * 리액트 컴포넌트가 마운트될 때 서버로부터 신선한 데이터를 가져오는 과정입니다.
     * useEffect 훅을 사용하여 비동기 통신을 처리하는 표준적인 방법을 눈여겨보세요.
     */
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/creator/stats?userId=default-creator');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('[Professor Note] Dashboard Loading Failed:', error);
                toast({
                    variant: "destructive",
                    title: "오류 발생",
                    description: "통계 데이터를 불러오지 못했습니다."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [toast]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">지식을 불러오는 중... 잠시만 기다려주세요.</div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* [강의 노트: 시각적 계층 구조]
          가장 중요한 정보(돈)를 상단에 배치하여 사용자의 시선을 먼저 잡는 전략입니다. */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">크리에이터 센터</h1>
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Partner Level 1</Badge>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">실적 개요</TabsTrigger>
                    <TabsTrigger value="strategy">사업 전략 및 비전</TabsTrigger>
                    <TabsTrigger value="revenue-model">수익 구조 분석</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* ... existing overview content ... */}
                </TabsContent>

                <TabsContent value="revenue-model" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-4 text-primary" />
                                📑 단위 매출 분석 (Unit Economics)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr className="text-left font-medium">
                                            <th className="p-2">항목 (Item)</th>
                                            <th className="p-2 text-right">금액 (KRW)</th>
                                            <th className="p-2 text-right">비중 (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr className="bg-primary/5 font-bold">
                                            <td className="p-2">매출 (오디오 가이드 정가)</td>
                                            <td className="p-2 text-right">20,000</td>
                                            <td className="p-2 text-right">100%</td>
                                        </tr>
                                        <tr className="text-red-500">
                                            <td className="p-2">(-) 할인 (코드 할인 50% 적용 시)</td>
                                            <td className="p-2 text-right">-10,000</td>
                                            <td className="p-2 text-right">-50%</td>
                                        </tr>
                                        <tr className="font-semibold border-t">
                                            <td className="p-2 text-primary">= 실 결제액 (Net Revenue)</td>
                                            <td className="p-2 text-right">10,000</td>
                                            <td className="p-2 text-right">50%</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2">(-) 가이드 정산금 (리워드 20%)</td>
                                            <td className="p-2 text-right">-2,000</td>
                                            <td className="p-2 text-right">-10%</td>
                                        </tr>
                                        <tr className="bg-green-50 text-green-700 font-bold">
                                            <td className="p-2">= 공헌 이익 (Contribution Margin)</td>
                                            <td className="p-2 text-right">7,600</td>
                                            <td className="p-2 text-right">38%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm italic">
                                💡 **회계부장 Note**: 할인을 50% 제공해도 개당 **7,600원의 높은 마진**이 남습니다.
                                약 355개 판매 시 초기 투자금(270만원) 회수가 가능합니다.
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-4 text-green-500" />
                                📅 월별 매출 시뮬레이션
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr className="text-left font-medium">
                                            <th className="p-2">월 (Month)</th>
                                            <th className="p-2 text-right">판매량</th>
                                            <th className="p-2 text-right">총 매출액</th>
                                            <th className="p-2 text-right text-green-600">순수익</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {[
                                            { m: '1개월차', q: 100, rev: '1,000,000', profit: '700,000' },
                                            { m: '2개월차', q: 200, rev: '2,000,000', profit: '1,500,000' },
                                            { m: '3개월차 (손익분기)', q: 400, rev: '4,000,000', profit: '3,050,000', highlight: true },
                                            { m: '6개월차 (연금달성)', q: 1000, rev: '10,000,000', profit: '7,700,000', highlight: true },
                                        ].map((row, idx) => (
                                            <tr key={idx} className={row.highlight ? "bg-amber-50 font-semibold" : ""}>
                                                <td className="p-2">{row.m}</td>
                                                <td className="p-2 text-right">{row.q}개</td>
                                                <td className="p-2 text-right">₩{row.rev}</td>
                                                <td className="p-2 text-right text-green-600">₩{row.profit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                ※ 매달 파트너가 늘어나며 판매량이 20%씩 성장한다고 가정했을 때의 보수적 시뮬레이션입니다.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-4 text-blue-500" />
                                💳 크레딧 부채 및 낙전 수입 관리
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-bold text-sm mb-2">추천 크레딧 (10%)</h4>
                                    <p className="text-xs text-muted-foreground">예상 소멸율: **60% 이상**</p>
                                    <p className="text-xs mt-1">대부분의 승객은 일회성 여행이므로 포인트 미사용 소멸로 인한 낙전 수입이 발생합니다.</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-bold text-sm mb-2">이벤트 크레딧 (가입축하)</h4>
                                    <p className="text-xs text-muted-foreground">예상 소멸율: **80% 이상**</p>
                                    <p className="text-xs mt-1">장부상 부채로 잡히지만, 실제로는 마케팅 비용 절감 및 무상 수익으로 전환됩니다.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strategy" className="space-y-6">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-primary" />
                                어벤져스 팀의 수익화 로드맵
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <h3 className="font-bold flex items-center gap-2 mb-2">
                                        <Globe className="w-4 h-4 text-blue-500" />
                                        글로벌 확장 (쏭 프로)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        유튜브/틱톡 인플루언서 제휴 및 전 세계 API 연동을 통해 전방위 수익원을 확보합니다.
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <h3 className="font-bold flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        업무 자동화 (박사님)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        SNS 자동 포스팅 및 데이터 최적화를 통해 리소스 낭비 없는 수익 창출 루프를 만듭니다.
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <h3 className="font-bold flex items-center gap-2 mb-2">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        투명한 정산 (회계부장)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Stripe 기반의 안전한 결제와 7:3 수익 배분 원칙으로 가장 신뢰받는 플랫폼을 구축합니다.
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <h3 className="font-bold flex items-center gap-2 mb-2">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        콘텐츠 본질 (코다리)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        OpenAI TTS 기술과 오프라인 가독성을 극대화하여 비교 불가한 사용자 만족도를 제공합니다.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-muted p-6 rounded-lg text-center">
                                <blockquote className="italic text-lg font-serif">
                                    "사람은 생각하고, 기계는 일하게 하라. 대표님의 시간과 자유를 위해 시스템이 움직입니다."
                                </blockquote>
                                <p className="text-xs text-muted-foreground mt-2">— 어벤져스 전략 사무국</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground py-4">
                [교수님의 한마디] 여러분의 가이드가 누군가에게는 최고의 여행 추억이 됩니다. 지속적으로 퀄리티를 높여보세요!
            </p>
        </div>
    );
}
