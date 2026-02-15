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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">실적 개요</TabsTrigger>
                    <TabsTrigger value="strategy">사업 전략 및 비전</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* 수익 요약 카드 */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">출금 가능 수익</CardTitle>
                                <Wallet className="w-4 h-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">€{(stats?.totalBalance || 0).toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    언제든지 정산을 신청할 수 있습니다.
                                </p>
                            </CardContent>
                        </Card>

                        {/* 누적 성과 카드 */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">총 누적 수익</CardTitle>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">€{(stats?.totalEarned || 0).toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    플랫폼 참여 이후 총 성과입니다.
                                </p>
                            </CardContent>
                        </Card>

                        {/* 방문자 통계 카드 */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">총 가이드 이용객</CardTitle>
                                <Users className="w-4 h-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.visitorCount || 0}명</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    당신의 가이드를 통해 세상을 즐긴 사람들입니다.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* [강의 노트: CTA(Call To Action) 설계]
                  사용자가 다음 행동(예: 수익 인출)을 명확히 알 수 있도록 버튼을 구성합니다. */}
                    <div className="bg-muted/50 p-6 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                정산받을 준비가 되셨나요?
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                정산 신청 시 등록된 계좌로 3~5영업일 이내에 송금됩니다.
                            </p>
                        </div>
                        <Button className="w-full md:w-auto gap-2">
                            <ArrowDownToLine className="w-4 h-4" />
                            수익 출금하기
                        </Button>
                    </div>

                    {/* 최근 활동 섹션 (샘플 리스트) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">실시간 수익 발생 내역</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">로마 가이드 패키지 결제</span>
                                            <span className="text-xs text-muted-foreground">2024-02-10 14:30</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-primary">+€3.50</span>
                                            <Badge variant="outline" className="text-[10px]">지급완료</Badge>
                                        </div>
                                    </div>
                                ))}
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
