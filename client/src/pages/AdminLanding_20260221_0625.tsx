import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
    Shield,
    TrendingUp,
    MapPin,
    Users,
    Zap,
    ArrowRight,
    Globe,
    Sparkles,
    LayoutDashboard,
    Wallet,
    CheckCircle2,
    Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * [강의 노트: 어드민 랜딩 페이지 - 어벤져스 요원들을 위한 관문]
 * 사장님과 어벤져스 팀원들이 앱의 정수와 비즈니스 성과를 한눈에 볼 수 있는 페이지입니다.
 * 단순한 관리가 아니라 '성장과 비전'을 공유하는 공간으로 설계했습니다.
 */
export default function AdminLanding() {
    const [, setLocation] = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const metrics = [
        { label: '단위 매출 마진', value: '76%', description: 'Net Revenue 기반 공헌 이익', icon: Wallet, color: 'text-green-500' },
        { label: '초기 투자 회수', value: '3개월', description: '가장 보수적인 시나리오 기준', icon: Rocket, color: 'text-amber-500' },
        { label: '누적 랜드마크', value: '345+', description: '전 세계 주요 크루즈 기항지', icon: MapPin, color: 'text-blue-500' },
        { label: '월 예상 순수익', value: '₩7.7M', description: '오픈 6개월차 목표 수익', icon: TrendingUp, color: 'text-primary' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary selection:text-white overflow-hidden">
            {/* [디자인 포인트: 입체적인 배경]
               단조로운 어두운 배경이 아니라, 그라데이션과 블러 효과를 주어 깊이감을 주었습니다. */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 py-3' : 'bg-transparent py-5'}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary rounded-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Avengers Control</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#vision" className="hover:text-primary transition-colors">비전</a>
                        <a href="#revenue" className="hover:text-primary transition-colors">수익구조</a>
                        <a href="#stats" className="hover:text-primary transition-colors">데이터건강도</a>
                    </div>
                    <Button
                        onClick={() => setLocation('/admin/dashboard')}
                        className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105"
                    >
                        마스터 대시보드 진입
                    </Button>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20">
                <section className="container mx-auto px-6 text-center mb-24">
                    <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 px-4 py-1">
                        <Sparkles className="w-3 h-3 mr-2" />
                        Global No.1 Offline Audio Guide Platform
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-tight">
                        데이터로 증명하고<br />수익으로 답하다
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        어벤져스 팀이 구축한 독점적인 오프라인 오디오 가이드 엔진이<br />
                        전 세계 크루즈 승객들의 시간을 가치 있게 바꿉니다.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="px-8 h-14 text-lg font-bold" onClick={() => setLocation('/admin/dashboard')}>
                            운영 시스템 시작 <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="px-8 h-14 text-lg border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                            수익 시뮬레이션 상세 보기
                        </Button>
                    </div>
                </section>

                <section className="container mx-auto px-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-24" id="stats">
                    {metrics.map((m, i) => (
                        <Card key={i} className="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:border-primary/50 transition-all hover:translate-y-[-4px] overflow-hidden group">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <m.icon className={`w-5 h-5 ${m.color}`} />
                                    <Zap className="w-3 h-3 text-slate-700 group-hover:text-primary transition-colors" />
                                </div>
                                <CardTitle className="text-sm font-medium text-slate-400">{m.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-1">{m.value}</div>
                                <p className="text-xs text-slate-500">{m.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="container mx-auto px-6 mb-24" id="revenue">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                효율적인 정산과 투명한 수익 구조
                            </h2>
                            <p className="text-slate-400 leading-relaxed">
                                디지털 재화의 특성을 극대화하여 원가 절감을 실현했습니다.
                                친구 초대, 이벤트 크레딧 등 적극적인 프로모션 후에도 확보되는
                                76%의 마진율은 플랫폼의 강력한 기초 체력입니다.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    '결제액 50% 할인 시에도 순수익 ₩7,600 확보',
                                    '가이드 및 승무원 파트너십을 통한 무자본 마케팅',
                                    '미사용 크레딧 소멸을 통한 낙전 수입의 영업외 수익화',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <div className="mt-1 p-0.5 rounded-full bg-primary/20 text-primary">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10" />
                            <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-2xl">
                                <div className="p-1 bg-gradient-to-r from-primary/50 to-blue-500/50" />
                                <CardHeader className="bg-slate-900/40">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        월 매출 시뮬레이션 (Projection)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-950/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-medium text-slate-400">Month</th>
                                                <th className="px-6 py-4 text-right font-medium text-slate-400">판매량</th>
                                                <th className="px-6 py-4 text-right font-medium text-slate-400">순수익</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {[
                                                { m: '1개월차', q: '100개', p: '₩700K' },
                                                { m: '2개월차', q: '200개', p: '₩1.5M' },
                                                { m: '3개월차', q: '400개', p: '₩3.0M', highlight: true },
                                                { m: '6개월차', q: '1,000개', p: '₩7.7M', highlight: true },
                                            ].map((r, i) => (
                                                <tr key={i} className={`hover:bg-slate-800/30 transition-colors ${r.highlight ? 'bg-primary/5' : ''}`}>
                                                    <td className="px-6 py-4 font-medium">{r.m}</td>
                                                    <td className="px-6 py-4 text-right text-slate-300">{r.q}</td>
                                                    <td className={`px-6 py-4 text-right font-bold ${r.highlight ? 'text-primary' : ''}`}>{r.p}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 border-t border-slate-900 py-12 bg-slate-950">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 grayscale brightness-50">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-bold opacity-70">Antigravity AI Engine</span>
                    </div>
                    <p className="text-slate-500 text-xs">
                        © 2026 어벤져스 팀 전략 사무국. 모든 권리는 비즈니스 확장과 성장에 있습니다.
                    </p>
                    <div className="flex gap-4">
                        <Globe className="w-4 h-4 text-slate-600 hover:text-primary cursor-pointer transition-colors" />
                        <Users className="w-4 h-4 text-slate-600 hover:text-primary cursor-pointer transition-colors" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
