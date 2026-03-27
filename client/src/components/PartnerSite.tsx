import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Globe, Layout, Share2, Eye,
    MousePointer2, BarChart3, ExternalLink,
    Rocket, Palette, Settings, Copy, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PartnerSiteProps {
    user: any;
    selectedLanguage: string;
}

export default function PartnerSite({ user, selectedLanguage }: PartnerSiteProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const agentUrl = `https://gps.tours/a/${user?.referralCode || 'agent'}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(agentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: selectedLanguage === 'ko' ? "복사 완료" : "URL Copied",
            description: selectedLanguage === 'ko' ? "개인 홍보 페이지 주소가 복사되었습니다." : "Agent page URL copied to clipboard.",
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Site Preview Hero */}
            <div className="relative group overflow-hidden rounded-3xl border border-border/50 bg-muted/20 pb-8">
                <div className="aspect-[16/9] overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
                        alt="Site Preview"
                        className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

                <div className="relative -mt-20 px-6 space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary shadow-xl shadow-primary/30 flex items-center justify-center">
                        <Globe className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold tracking-tight">
                            {user?.displayName || 'Advisor'}님의 개인 홍보 페이지
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedLanguage === 'ko'
                                ? '당신의 성공을 돕는 전문가용 랜딩 페이지가 자동으로 생성되었습니다.'
                                : 'A professional landing page has been automatically generated for your success.'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className="flex-1 h-12 rounded-xl gap-2 shadow-lg shadow-primary/20"
                            onClick={copyToClipboard}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            {selectedLanguage === 'ko' ? '주소 복사하기' : 'Copy URL'}
                        </Button>
                        <Button variant="outline" className="h-12 w-12 rounded-xl border-border/50">
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Platform Integrations */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-none bg-muted/30 shadow-none">
                    <CardContent className="p-4 space-y-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Layout className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-bold tracking-tight">커스텀 디자인</div>
                            <div className="text-[10px] text-muted-foreground">브랜딩 테마 및 로고 설정</div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] gap-1 px-0 justify-start hover:bg-transparent text-indigo-500">
                            설정 이동 <Settings className="w-3 h-3" />
                        </Button>
                    </CardContent>
                </Card>
                <Card className="border-none bg-muted/30 shadow-none">
                    <CardContent className="p-4 space-y-3">
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-pink-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-bold tracking-tight">방문자 분석</div>
                            <div className="text-[10px] text-muted-foreground">실시간 트래픽 및 클릭률</div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] gap-1 px-0 justify-start hover:bg-transparent text-pink-500">
                            리포트 보기 <BarChart3 className="w-3 h-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Roadmap to High Traffic */}
            <Card className="border-border/50 bg-card/50 overflow-hidden">
                <CardHeader className="p-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-primary" />
                        성공적인 홍보를 위한 가이드
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="space-y-3">
                        {[
                            { step: 1, title: 'SNS 프로필 링크 등록', desc: '인스타그램, 블로그 상단에 주소를 노출하세요.' },
                            { step: 2, title: 'QR 코드 명함 제작', desc: '오프라인 미팅 시 바로 스캔할 수 있게 하세요.' },
                            { step: 3, title: '상조 회원 맞춤 공유', desc: '오디오 가이드 혜택을 포인트와 연결해 설명하세요.' }
                        ].map((item) => (
                            <div key={item.step} className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {item.step}
                                </div>
                                <div className="space-y-1 pt-0.5">
                                    <div className="text-[11px] font-bold tracking-tight">{item.title}</div>
                                    <div className="text-[10px] text-muted-foreground leading-tight">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
