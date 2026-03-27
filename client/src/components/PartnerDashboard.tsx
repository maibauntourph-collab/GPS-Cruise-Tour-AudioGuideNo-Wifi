import { useState } from 'react';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp, Users, Wallet, QrCode, Award,
    ArrowUpRight, Copy, Share2, Calculator, Info, History, Clock
} from 'lucide-react';
import { t } from '@/lib/translations';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';


interface PartnerDashboardProps {
    user: any; // User object from auth
    selectedLanguage: string;
}

export default function PartnerDashboard({ user, selectedLanguage }: PartnerDashboardProps) {
    const [copied, setCopied] = useState(false);

    const { data: partnerStats, isLoading: isStatsLoading } = useQuery<any>({
        queryKey: ['/api/partner/stats'],
    });

    const { data: commissionHistory, isLoading: isHistoryLoading } = useQuery<any[]>({
        queryKey: ['/api/partner/commissions'],
    });

    const stats = {
        level: partnerStats?.level || user?.agentLevel || 'L0',
        totalEarned: partnerStats?.totalEarned || 0,
        teamSize: partnerStats?.teamSize || 0,
        balance: partnerStats?.balance || 0,
        referralCode: partnerStats?.referralCode || user?.referralCode || 'N/A',
        nextLevelProgress: partnerStats?.nextLevelProgress || 0,
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`https://gps.tours/join?ref=${stats.referralCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isStatsLoading) {
        return (
            <div className="space-y-6 p-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }


    return (
        <div className="space-y-6 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Level Badge */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {selectedLanguage === 'ko' ? '파트너 센터' : 'Partner Center'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {selectedLanguage === 'ko' ? `${user?.displayName || '영업자'}님, 오늘도 건승하세요!` : `Welcome back, ${user?.displayName || 'Partner'}!`}
                    </p>
                </div>
                <Badge className="h-10 px-4 text-sm gap-2 bg-primary hover:bg-primary/90">
                    <Award className="w-4 h-4" />
                    {stats.level} {selectedLanguage === 'ko' ? '어드바이저' : 'Advisor'}
                </Badge>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="glass-premium border-none">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <Wallet className="w-3 h-3" />
                            {selectedLanguage === 'ko' ? '출금 가능 잔액' : 'Balance'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">₩{stats.balance.toLocaleString()}</div>
                        <Button variant="ghost" className="h-auto p-0 text-[10px] text-primary underline hover:bg-transparent">
                            {selectedLanguage === 'ko' ? '정산 신청하기' : 'Request Payout'}
                            <ArrowUpRight className="w-2 h-2 ml-1" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-premium border-none">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            {selectedLanguage === 'ko' ? '누적 수익' : 'Total Earned'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            ₩{stats.totalEarned.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Level Progress */}
            <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{stats.level} Next Level</span>
                        <span className="text-muted-foreground">{stats.nextLevelProgress}%</span>
                    </div>
                    <Progress value={stats.nextLevelProgress} className="h-2" />
                    <p className="text-[10px] text-muted-foreground text-center">
                        {selectedLanguage === 'ko'
                            ? 'L2 시니어 승급까지 350만 원의 실적이 더 필요합니다.'
                            : '₩3.5M more sales needed to reach L2 Senior.'}
                    </p>
                </CardContent>
            </Card>

            {/* Team & Referral Section */}
            <div className="grid grid-cols-1 gap-4">
                <Card className="border-none shadow-lg">
                    <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <CardTitle className="text-sm">
                                {selectedLanguage === 'ko' ? '내 팀 관리' : 'My Team'}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.teamSize}명</div>
                            <Button size="sm" variant="outline" className="h-8 text-xs">
                                {selectedLanguage === 'ko' ? '조직도 보기' : 'View Tree'}
                            </Button>
                        </div>

                        {/* Referral Code Box */}
                        <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                {selectedLanguage === 'ko' ? '내 추천 코드' : 'Referral Code'}
                            </Label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-background px-2 py-1.5 rounded border text-sm font-mono tracking-tight">
                                    {stats.referralCode}
                                </code>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyToClipboard}>
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <QrCode className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Commission History */}
            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="p-4 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-500" />
                        <CardTitle className="text-sm">
                            {selectedLanguage === 'ko' ? '최근 수익 내역' : 'Recent Earnings'}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {commissionHistory && commissionHistory.length > 0 ? (
                        <Table>
                            <TableBody>
                                {commissionHistory.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="p-3 text-[10px] text-muted-foreground">
                                            {format(new Date(item.createdAt), 'MM/dd HH:mm')}
                                        </TableCell>
                                        <TableCell className="p-3">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-medium">
                                                    {selectedLanguage === 'ko' ? `${item.level}단계 수당` : `L${item.level} Reward`}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground uppercase">
                                                    {item.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-3 text-right font-bold text-sm text-emerald-600">
                                            +₩{item.amount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center space-y-2">
                            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                            <p className="text-xs text-muted-foreground">
                                {selectedLanguage === 'ko' ? '아직 발생한 수익이 없습니다.' : 'No earnings yet.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Help / Commission Info */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-primary">
                        {selectedLanguage === 'ko' ? '이번 달 정산 안내' : 'Payout Information'}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {selectedLanguage === 'ko'
                            ? '익월 5일에 전월 수당이 자동으로 확정되며, 10일부터 출금이 가능합니다. 제휴 수수료는 플랫폼 확정 시간에 따라 변동될 수 있습니다.'
                            : 'Commissions are finalized on the 5th of next month. Payouts available from the 10th. Affiliate rewards depend on platform confirmation.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper types if needed
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
