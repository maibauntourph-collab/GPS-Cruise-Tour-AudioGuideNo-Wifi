import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Users, Clock, CheckCircle, MapPin, Plus, Pencil, Trash2, 
  Download, Upload, FileSpreadsheet, Loader2, Phone, Mail, Home, Share2, Copy, MessageCircle
} from "lucide-react";
import type { TourSchedule, GroupMember } from "@shared/schema";

export default function TourLeaderView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tourId = 'default';

  // Schedule state
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TourSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ time: '', location: '', duration: '', notes: '' });

  // Member state
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', email: '', roomNumber: '', notes: '' });

  // Import state
  const [importType, setImportType] = useState<'schedules' | 'members'>('members');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'schedule' | 'member'; id: string; name: string } | null>(null);

  // Fetch schedules
  const { data: schedules = [], isLoading: loadingSchedules, error: schedulesError } = useQuery<TourSchedule[]>({
    queryKey: ['/api/tour-leader/schedules', tourId],
    queryFn: async () => {
      const res = await fetch(`/api/tour-leader/schedules?tourId=${tourId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch schedules' }));
        throw new Error(errorData.error || 'Failed to fetch schedules');
      }
      return res.json();
    }
  });

  // Fetch members
  const { data: members = [], isLoading: loadingMembers, error: membersError } = useQuery<GroupMember[]>({
    queryKey: ['/api/tour-leader/members', tourId],
    queryFn: async () => {
      const res = await fetch(`/api/tour-leader/members?tourId=${tourId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch members' }));
        throw new Error(errorData.error || 'Failed to fetch members');
      }
      return res.json();
    }
  });

  // Schedule mutations
  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/tour-leader/schedules', { ...data, tourId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/schedules'] });
      setIsScheduleDialogOpen(false);
      setScheduleForm({ time: '', location: '', duration: '', notes: '' });
      toast({ title: '일정이 추가되었습니다' });
    },
    onError: () => toast({ title: '일정 추가 실패', variant: 'destructive' })
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/tour-leader/schedules/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/schedules'] });
      setIsScheduleDialogOpen(false);
      setEditingSchedule(null);
      toast({ title: '일정이 수정되었습니다' });
    },
    onError: () => toast({ title: '일정 수정 실패', variant: 'destructive' })
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/tour-leader/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/schedules'] });
      setDeleteConfirm(null);
      toast({ title: '일정이 삭제되었습니다' });
    },
    onError: () => toast({ title: '일정 삭제 실패', variant: 'destructive' })
  });

  // Member mutations
  const createMemberMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/tour-leader/members', { ...data, tourId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/members'] });
      setIsMemberDialogOpen(false);
      setMemberForm({ name: '', phone: '', email: '', roomNumber: '', notes: '' });
      toast({ title: '멤버가 추가되었습니다' });
    },
    onError: () => toast({ title: '멤버 추가 실패', variant: 'destructive' })
  });

  const updateMemberMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/tour-leader/members/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/members'] });
      setIsMemberDialogOpen(false);
      setEditingMember(null);
      toast({ title: '멤버 정보가 수정되었습니다' });
    },
    onError: () => toast({ title: '멤버 수정 실패', variant: 'destructive' })
  });

  const updateMemberStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest('PATCH', `/api/tour-leader/members/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/members'] });
      toast({ title: '상태가 변경되었습니다' });
    },
    onError: () => toast({ title: '상태 변경 실패', variant: 'destructive' })
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/tour-leader/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/members'] });
      setDeleteConfirm(null);
      toast({ title: '멤버가 삭제되었습니다' });
    },
    onError: () => toast({ title: '멤버 삭제 실패', variant: 'destructive' })
  });

  // Handle schedule dialog open
  const openScheduleDialog = (schedule?: TourSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        time: schedule.time,
        location: schedule.location,
        duration: schedule.duration || '',
        notes: schedule.notes || ''
      });
    } else {
      setEditingSchedule(null);
      setScheduleForm({ time: '', location: '', duration: '', notes: '' });
    }
    setIsScheduleDialogOpen(true);
  };

  // Handle member dialog open
  const openMemberDialog = (member?: GroupMember) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name,
        phone: member.phone || '',
        email: member.email || '',
        roomNumber: member.roomNumber || '',
        notes: member.notes || ''
      });
    } else {
      setEditingMember(null);
      setMemberForm({ name: '', phone: '', email: '', roomNumber: '', notes: '' });
    }
    setIsMemberDialogOpen(true);
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('tourId', tourId);
    
    try {
      const endpoint = importType === 'schedules' 
        ? '/api/tour-leader/import/schedules' 
        : '/api/tour-leader/import/members';
      
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      const result = await response.json();
      
      if (response.ok) {
        toast({ title: `${result.imported}개 항목이 가져와졌습니다` });
        queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/schedules'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tour-leader/members'] });
        setImportFile(null);
      } else {
        toast({ title: result.error || '가져오기 실패', variant: 'destructive' });
      }
    } catch {
      toast({ title: '가져오기 중 오류 발생', variant: 'destructive' });
    }
    setImporting(false);
  };

  const onTimeCount = members.filter(m => m.status === 'on-time').length;
  const lateCount = members.filter(m => m.status === 'late').length;
  const absentCount = members.filter(m => m.status === 'absent').length;

  const statusColors: Record<string, string> = {
    'on-time': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    'late': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    'absent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
  };

  const statusLabels: Record<string, string> = {
    'on-time': '정시',
    'late': '지연',
    'absent': '결석'
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
            <Users className="w-4 h-4 inline mr-1" /> 인솔자 모드
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            투어 관리
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/")}
          data-testid="button-back-to-role-selection"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          역할 변경
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-leader-navigation">
            <TabsTrigger value="members" data-testid="tab-members">
              <Users className="w-4 h-4 mr-2" />
              그룹 멤버 ({members.length})
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              <Clock className="w-4 h-4 mr-2" />
              일정표 ({schedules.length})
            </TabsTrigger>
            <TabsTrigger value="status" data-testid="tab-status">
              <CheckCircle className="w-4 h-4 mr-2" />
              현황
            </TabsTrigger>
            <TabsTrigger value="import-export" data-testid="tab-import-export">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              엑셀
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-3 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">그룹 멤버 관리</h2>
              <Button onClick={() => openMemberDialog()} data-testid="button-add-member">
                <Plus className="w-4 h-4 mr-2" />
                멤버 추가
              </Button>
            </div>

            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                멤버가 없습니다. 멤버를 추가하거나 엑셀 파일을 가져오세요.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((member) => (
                  <Card
                    key={member.id}
                    className="p-4 hover-elevate"
                    data-testid={`card-member-${member.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          {member.name}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                          {member.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {member.phone}
                            </p>
                          )}
                          {member.email && (
                            <p className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {member.email}
                            </p>
                          )}
                          {member.roomNumber && (
                            <p className="flex items-center gap-1">
                              <Home className="w-3 h-3" /> 객실 {member.roomNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Select
                          value={member.status}
                          onValueChange={(status) => updateMemberStatusMutation.mutate({ id: member.id, status })}
                        >
                          <SelectTrigger className={`w-24 h-8 text-xs ${statusColors[member.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-time">정시</SelectItem>
                            <SelectItem value="late">지연</SelectItem>
                            <SelectItem value="absent">결석</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openMemberDialog(member)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'member', id: member.id, name: member.name })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-3 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">일정표 관리</h2>
              <Button onClick={() => openScheduleDialog()} data-testid="button-add-schedule">
                <Plus className="w-4 h-4 mr-2" />
                일정 추가
              </Button>
            </div>

            {loadingSchedules ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : schedules.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                일정이 없습니다. 일정을 추가하거나 엑셀 파일을 가져오세요.
              </Card>
            ) : (
              <div className="space-y-2">
                {schedules.map((item, idx) => (
                  <Card
                    key={item.id}
                    className="p-4 flex items-start gap-4 hover-elevate"
                    data-testid={`card-schedule-${item.id}`}
                  >
                    <div className="flex flex-col items-center min-w-[60px]">
                      <Clock className="w-5 h-5 text-blue-500 mb-1" />
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.time}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        {item.location}
                      </p>
                      {item.duration && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          소요시간: {item.duration}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openScheduleDialog(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'schedule', id: item.id, name: item.location })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="mt-4">
            <div className="space-y-4">
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  참가자 현황
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {onTimeCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">정시 도착</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                      {lateCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">지연</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                      {absentCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">결석</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-center text-gray-700 dark:text-gray-300">
                    총 <span className="font-bold text-blue-600">{members.length}</span>명 중 <span className="font-bold text-green-600">{onTimeCount}</span>명 정시 ({members.length > 0 ? Math.round(onTimeCount / members.length * 100) : 0}%)
                  </p>
                </div>
              </Card>

              {schedules.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    다음 일정
                  </h3>
                  <div className="flex items-center gap-4">
                    <Clock className="w-10 h-10 text-green-500" />
                    <div>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {schedules[0].time} - {schedules[0].location}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {schedules[0].duration && `예상 소요시간: ${schedules[0].duration}`}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Share Report */}
              <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-green-600" />
                  진행상황 리포트 공유
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  카카오톡, WhatsApp, LINE, Messenger 등 원하는 앱으로 투어 진행상황을 공유하세요.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                      const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
                      
                      const reportText = `📋 투어 진행상황 리포트
📅 ${dateStr} ${timeStr}

👥 참가자 현황
• 총 인원: ${members.length}명
• 정시 도착: ${onTimeCount}명 ✅
• 지연: ${lateCount}명 ⏰
• 결석: ${absentCount}명 ❌
• 참석률: ${members.length > 0 ? Math.round(onTimeCount / members.length * 100) : 0}%

${schedules.length > 0 ? `📍 다음 일정
• ${schedules[0].time} - ${schedules[0].location}${schedules[0].duration ? ` (${schedules[0].duration})` : ''}` : ''}

${lateCount > 0 || absentCount > 0 ? `⚠️ 미도착 명단
${members.filter(m => m.status !== 'on-time').map(m => `• ${m.name} (${statusLabels[m.status]})`).join('\n')}` : '✨ 전원 정시 도착!'}`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: '투어 진행상황 리포트',
                          text: reportText
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(reportText);
                        toast({ title: '리포트가 클립보드에 복사되었습니다' });
                      }
                    }}
                    data-testid="button-share-report"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    앱으로 공유하기
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                      const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
                      
                      const reportText = `📋 투어 진행상황 리포트
📅 ${dateStr} ${timeStr}

👥 참가자 현황
• 총 인원: ${members.length}명
• 정시 도착: ${onTimeCount}명 ✅
• 지연: ${lateCount}명 ⏰
• 결석: ${absentCount}명 ❌
• 참석률: ${members.length > 0 ? Math.round(onTimeCount / members.length * 100) : 0}%

${schedules.length > 0 ? `📍 다음 일정
• ${schedules[0].time} - ${schedules[0].location}${schedules[0].duration ? ` (${schedules[0].duration})` : ''}` : ''}

${lateCount > 0 || absentCount > 0 ? `⚠️ 미도착 명단
${members.filter(m => m.status !== 'on-time').map(m => `• ${m.name} (${statusLabels[m.status]})`).join('\n')}` : '✨ 전원 정시 도착!'}`;
                      
                      navigator.clipboard.writeText(reportText);
                      toast({ title: '리포트가 클립보드에 복사되었습니다' });
                    }}
                    data-testid="button-copy-report"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    클립보드 복사
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Export */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  내보내기
                </h3>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`/api/tour-leader/export/members?tourId=${tourId}&format=xlsx`, '_blank')}
                    data-testid="button-export-members-xlsx"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    그룹 멤버 다운로드 (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`/api/tour-leader/export/schedules?tourId=${tourId}&format=xlsx`, '_blank')}
                    data-testid="button-export-schedules-xlsx"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    일정표 다운로드 (.xlsx)
                  </Button>
                </div>
              </Card>

              {/* Import */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  가져오기
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>데이터 유형</Label>
                    <Select value={importType} onValueChange={(v: 'schedules' | 'members') => setImportType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="members">그룹 멤버</SelectItem>
                        <SelectItem value="schedules">일정표</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>파일 선택</Label>
                    <Input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      data-testid="input-import-file"
                    />
                    <p className="text-xs text-muted-foreground">
                      .xlsx 또는 .csv 파일 지원
                    </p>
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="w-full"
                    data-testid="button-import"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        가져오는 중...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        가져오기
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? '일정 수정' : '새 일정 추가'}</DialogTitle>
            <DialogDescription>일정 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingSchedule) {
              updateScheduleMutation.mutate({ id: editingSchedule.id, ...scheduleForm });
            } else {
              createScheduleMutation.mutate(scheduleForm);
            }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-time">시간 *</Label>
                <Input
                  id="schedule-time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="09:00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-duration">소요시간</Label>
                <Input
                  id="schedule-duration"
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="30분"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-location">장소 *</Label>
              <Input
                id="schedule-location"
                value={scheduleForm.location}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="판테온"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-notes">메모</Label>
              <Textarea
                id="schedule-notes"
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 정보..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}>
                {(createScheduleMutation.isPending || updateScheduleMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? '멤버 수정' : '새 멤버 추가'}</DialogTitle>
            <DialogDescription>멤버 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingMember) {
              updateMemberMutation.mutate({ id: editingMember.id, ...memberForm });
            } else {
              createMemberMutation.mutate(memberForm);
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">이름 *</Label>
              <Input
                id="member-name"
                value={memberForm.name}
                onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="홍길동"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member-phone">전화번호</Label>
                <Input
                  id="member-phone"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-room">객실 번호</Label>
                <Input
                  id="member-room"
                  value={memberForm.roomNumber}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="501"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">이메일</Label>
              <Input
                id="member-email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-notes">메모</Label>
              <Textarea
                id="member-notes"
                value={memberForm.notes}
                onChange={(e) => setMemberForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 정보..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMemberDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={createMemberMutation.isPending || updateMemberMutation.isPending}>
                {(createMemberMutation.isPending || updateMemberMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
            <DialogDescription>
              "{deleteConfirm?.name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>취소</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm?.type === 'schedule') {
                  deleteScheduleMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'member') {
                  deleteMemberMutation.mutate(deleteConfirm.id);
                }
              }}
              disabled={deleteScheduleMutation.isPending || deleteMemberMutation.isPending}
            >
              {(deleteScheduleMutation.isPending || deleteMemberMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
