import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Users, Search, Plus, MessageSquare,
    Calendar, FileText, Send, ExternalLink,
    MoreHorizontal, CheckCircle2, Clock,
    Share2, Slack, Database
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface PartnerCRMProps {
    selectedLanguage: string;
}

export default function PartnerCRM({ selectedLanguage }: PartnerCRMProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: leads, isLoading } = useQuery<any[]>({
        queryKey: ['/api/partner/leads'],
    });

    const syncMutation = useMutation({
        mutationFn: async (leadId: string) => {
            const res = await fetch(`/api/partner/leads/${leadId}/sync`, { method: 'POST' });
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: selectedLanguage === 'ko' ? "동기화 완료" : "Sync Complete",
                description: selectedLanguage === 'ko' ? "카카오톡 대화 내용이 문서화되어 노션/슬랙으로 전송되었습니다." : "Chat synced to Notion/Slack.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/partner/leads'] });
        }
    });

    const filteredLeads = leads?.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm)
    );

    if (isLoading) {
        return <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Search & Actions */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={selectedLanguage === 'ko' ? "가망 고객 검색..." : "Search prospects..."}
                        className="pl-10 h-10 bg-muted/30 border-none rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button size="icon" className="h-10 w-10 rounded-xl">
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 text-center">
                    <div className="text-lg font-bold text-blue-600">{leads?.length || 0}</div>
                    <div className="text-[10px] text-blue-500 font-medium">전체 고객</div>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-center">
                    <div className="text-lg font-bold text-emerald-600">
                        {leads?.filter((l: any) => l.status === 'meeting').length || 0}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium">미팅 확정</div>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 text-center">
                    <div className="text-lg font-bold text-orange-600">
                        {leads?.filter((l: any) => l.status === 'new').length || 0}
                    </div>
                    <div className="text-[10px] text-orange-500 font-medium">신규 문의</div>
                </div>
            </div>

            {/* Leads List */}
            <div className="space-y-4">
                {filteredLeads?.length === 0 ? (
                    <div className="p-12 text-center space-y-3 opacity-50">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">고객 데이터가 없습니다.</p>
                    </div>
                ) : (
                    filteredLeads?.map((lead) => (
                        <Card key={lead.id} className="border-border/40 overflow-hidden group hover:border-primary/50 transition-all duration-300">
                            <CardHeader className="p-4 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base tracking-tight">{lead.name}</span>
                                            <Badge variant="secondary" className="text-[9px] h-4">
                                                {lead.source === 'kakao' ? '카카오톡' : '직접입력'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono">{lead.phone}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {/* Next Step / Result Summary */}
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase">최근 상담 요약</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {lead.kakaoSyncData?.summary || "상담 이력이 없습니다. 동기화를 진행해주세요."}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-4 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 rounded-xl gap-2 text-[10px]"
                                        onClick={() => syncMutation.mutate(lead.id)}
                                        disabled={syncMutation.isPending}
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                        {selectedLanguage === 'ko' ? '카톡동기화' : 'Sync'}
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-[10px]">
                                        <Slack className="w-3 h-3" />
                                        {selectedLanguage === 'ko' ? '슬랙알림' : 'Slack'}
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-[10px]">
                                        <Database className="w-3 h-3" />
                                        {selectedLanguage === 'ko' ? '노션연결' : 'Notion'}
                                    </Button>
                                    <Button variant="default" size="sm" className="h-10 rounded-xl gap-2 text-[10px] bg-emerald-600 hover:bg-emerald-700">
                                        <Calendar className="w-3 h-3" />
                                        {selectedLanguage === 'ko' ? '미팅예약' : 'Meet'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* AI Assistant Tip */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-[9px]">AI Assistant</Badge>
                        <h4 className="text-xs font-bold font-primary tracking-tight">자동 응답 서비스 활성화됨</h4>
                    </div>
                    <p className="text-[10px] text-white/80 leading-relaxed">
                        부재중 전화나 챗봇 문의 시 AI가 담당자 정보를 문자로 자동 발송하고 미팅 예약을 제안합니다.
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                            <span className="text-[9px]">자동 문자 알림 ON</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-300" />
                            <span className="text-[9px]">미팅 스케줄링 대기</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
            </div>
        </div>
    );
}
