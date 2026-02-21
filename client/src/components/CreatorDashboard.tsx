import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Users, TrendingUp, ArrowDownToLine, CheckCircle2, Rocket, Globe, Zap, ShieldCheck, Heart, Sparkles, PieChart, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [강의 노트: 프리미엄 크리에이터 대시보드]
 * 학생 여러분, UI 고도화의 핵심은 '신뢰'와 '영감'입니다.
 * 크리에이터가 자신의 수익을 확인할 때, 마치 전문가용 금융 솔루션을 쓰는 듯한 느낌을 주어야 하죠.
 * Designer Kim의 Glassmorphism과 Server Park의 데이터 가시성을 결합했습니다.
 */
export default function CreatorDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 실시간 느낌을 주기 위한 가짜 딜레이
                await new Promise(resolve => setTimeout(resolve, 800));
                const response = await fetch('/api/creator/stats?userId=default-creator');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('[Professor Note] Dashboard Loading Failed:', error);
                toast({
                    variant: "destructive",
                    title: "데이터 연동 오류",
                    description: "서버로부터 실시간 통계를 가져오지 못했습니다."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [toast]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
                />
                <p className="text-sm font-medium text-primary/60 animate-pulse">데이터 엔진 가동 중...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-8 max-w-5xl mx-auto"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">
                        CREATOR CENTER
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">당신의 영감이 가치가 되는 곳</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="w-3 h-3 mr-1" /> Premium Partner
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">Level 1</Badge>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 p-1 bg-slate-100/50 backdrop-blur-sm rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">실적 개요</TabsTrigger>
                    <TabsTrigger value="strategy" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">비즈니스 로드맵</TabsTrigger>
                    <TabsTrigger value="revenue-model" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">수익 정밀 분석</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="overview">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
                        >
                            {[
                                { title: '이번 달 수익', val: '₩1,245,000', icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
                                { title: '활성 구독자', val: '1,240명', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { title: '평균 판매율', val: '12.5%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                                { title: '성장 지수', val: '+24.2%', icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-50' }
                            ].map((stat, i) => (
                                <Card key={i} className="border-none shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black mt-2 text-slate-800">{stat.val}</h3>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="revenue-model" className="space-y-6">
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                                <CardHeader className="bg-slate-900 text-white">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="w-5 h-5 text-primary" />
                                        Unit Economics: 단위 매출 정밀 분석
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="p-4 text-left font-bold text-slate-500">수익 구조 항목</th>
                                                    <th className="p-4 text-right font-bold text-slate-500">금액 (KRW)</th>
                                                    <th className="p-4 text-right font-bold text-slate-500">비중</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="bg-primary/5">
                                                    <td className="p-4 font-black">Gross Revenue (정가 판매 시)</td>
                                                    <td className="p-4 text-right font-bold">20,000</td>
                                                    <td className="p-4 text-right text-slate-400">100%</td>
                                                </tr>
                                                <tr className="text-rose-500 font-medium italic">
                                                    <td className="p-4 px-8">ㄴ 프로모션 할인 (최대 50%)</td>
                                                    <td className="p-4 text-right">-10,000</td>
                                                    <td className="p-4 text-right">-50%</td>
                                                </tr>
                                                <tr className="bg-slate-50/50 font-black border-t-2 border-primary/20">
                                                    <td className="p-4 text-primary">Net Revenue (실 결제액)</td>
                                                    <td className="p-4 text-right text-primary">10,000</td>
                                                    <td className="p-4 text-right text-primary/40">50%</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-4 px-8 text-slate-600">ㄴ 파트너 정산 (Reward 20%)</td>
                                                    <td className="p-4 text-right text-slate-600">-2,400</td>
                                                    <td className="p-4 text-right text-slate-400">-12%</td>
                                                </tr>
                                                <tr className="bg-emerald-50 text-emerald-700 font-black text-base">
                                                    <td className="p-4 tracking-tighter italic">Contribution Margin (최종 공헌 이익)</td>
                                                    <td className="p-4 text-right">₩7,600</td>
                                                    <td className="p-4 text-right">38.0%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-6 bg-primary/5 rounded-b-xl border-t border-primary/10">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <ShieldCheck className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 italic">Server Park 팀장의 수익 안정성 브리핑</h4>
                                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                                    "전 세계 크루즈 승객을 타겟으로 할 때, 38%의 공헌 이익율은 **압도적인 안정성**을 의미합니다.
                                                    특히 오프라인 기반이라 서버 비용이 거의 들지 않는다는 점이 우리 비즈니스의 핵심이죠."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="strategy" className="space-y-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
                            {[
                                { title: '글로벌 확장 (Marketer Song)', desc: '유튜브/틱톡 인플루언서 제휴 및 전 세계 항구 API 연동 수익 극대화.', icon: Globe, color: 'blue' },
                                { title: '업무 자동화 (Automation Doctor)', desc: 'SNS 자동 포스팅 및 AI 콘텐츠 생성을 통한 리소스 제로 수익 창출.', icon: Zap, color: 'yellow' },
                                { title: '수익 인프라 (Server Park)', desc: 'Stripe 글로벌 결제와 투명한 7:3 배분 원칙으로 신뢰 기반 도약.', icon: ShieldCheck, color: 'green' },
                                { title: '콘텐츠 철학 (Story Teller Lee)', desc: '가장 지루한 데이터를 가장 흥미로운 에피소드로 바꾸는 스토리 연금술.', icon: Heart, color: 'rose' }
                            ].map((item, i) => (
                                <Card key={i} className="group hover:bg-slate-50 transition-all border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-${item.color}-500 opacity-30 group-hover:opacity-100 transition-opacity`} />
                                    <CardContent className="p-5 flex gap-4">
                                        <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-800">{item.title}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                        <Card className="border-none bg-slate-900 text-white p-8 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                            <div className="relative z-10 space-y-4 text-center">
                                <blockquote className="text-xl font-serif italic tracking-tight opacity-90 underline decoration-primary/50 underline-offset-8">
                                    "대표님의 자유를 위해, 우리 어벤져스 시스템은 잠들지 않습니다."
                                </blockquote>
                                <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-50">Avengers Strategy Bureau 2026</p>
                            </div>
                        </Card>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            <footer className="pt-10 text-center">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    [교수님의 마지막 한마디] UI는 끝이 아니라 사용자 경험의 시작입니다. 훌륭히 해내셨습니다!
                </p>
            </footer>
        </motion.div>
    );
}
