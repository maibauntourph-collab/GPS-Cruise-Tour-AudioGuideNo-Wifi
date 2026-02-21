import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Sparkles, CheckCircle2, History, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DbCity } from "@shared/schema";

interface DiscoveredLandmark {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
    narration: string;
    description: string;
    detailedDescription: string;
    historicalInfo: string;
    isDuplicate: boolean;
    existingLandmark: any | null;
}

/**
 * [학습 가이드: AI 자동 탐사 다이얼로그]
 * 도시를 선택하면 AI가 새로운 명소를 추천하고, 기존 데이터와의 중복 여부를 
 * 검토하여 사용자(관리자)가 '확정'할 수 있게 도와주는 UI 컴포넌트입니다.
 */
export interface AIDiscoveryDialogProps {
    isOpen: boolean; // 다이얼로그 열림 상태
    onClose: () => void; // 닫기 함수
    cities: DbCity[]; // 선택 가능한 도시 목록
}

export function AIDiscoveryDialog({ isOpen, onClose, cities }: AIDiscoveryDialogProps) {
    const { toast } = useToast();
    const [selectedCityId, setSelectedCityId] = useState<string>("");
    // [적요: 로딩 상태 관리] 탐색 중(discovering)과 저장 중(applying)을 분리하여 버튼 활성화 상태를 제어합니다.
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    // [적요: 결과 데이터 관리] AI가 추천한 목록과 사용자가 체크한 ID 목록을 관리합니다.
    const [discoveredItems, setDiscoveredItems] = useState<DiscoveredLandmark[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // [적요: 중복 처리 옵션] 동일 장소가 있을 때 AI 버전으로 덮어쓸지 여부를 저장합니다.
    const [useAIVersion, setUseAIVersion] = useState<Record<string, boolean>>({});

    const handleDiscover = async () => {
        if (!selectedCityId) {
            toast({ title: "도시를 선택해주세요.", variant: "destructive" });
            return;
        }

        setIsDiscovering(true);
        setDiscoveredItems([]);
        setSelectedIds(new Set());

        try {
            const response = await fetch(`/api/admin/ai/discover?cityId=${selectedCityId}`);
            if (!response.ok) throw new Error("탐사 실패");
            const data = await response.json();
            setDiscoveredItems(data);

            // Default selections: new items selected by default
            const initialSelected = new Set<string>();
            const initialIVersion: Record<string, boolean> = {};
            data.forEach((item: DiscoveredLandmark) => {
                if (!item.isDuplicate) {
                    initialSelected.add(item.id);
                }
                initialIVersion[item.id] = true; // Default to AI version if selected
            });
            setSelectedIds(initialSelected);
            setUseAIVersion(initialIVersion);

            toast({ title: `${data.length}개의 새로운 장소를 발견했습니다!` });
        } catch (error) {
            toast({ title: "AI 탐사 실패", description: "OpenAI API 호출 중 오류가 발생했습니다.", variant: "destructive" });
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleApply = async () => {
        if (selectedIds.size === 0) {
            toast({ title: "적용할 항목을 선택해주세요.", variant: "destructive" });
            return;
        }

        setIsApplying(true);
        try {
            const selectedItems = discoveredItems
                .filter(item => selectedIds.has(item.id))
                .map(item => {
                    // If duplicate and users opted for existing one, it shouldn't really be here but just in case
                    // but if they chose AI version for a duplicate, we use its narration.
                    return item;
                });

            const response = await apiRequest("POST", "/api/admin/ai/apply", {
                cityId: selectedCityId,
                selectedLandmarks: selectedItems
            });

            toast({ title: "성공적으로 적용되었습니다.", description: `${selectedItems.length}개의 장소가 업데이트되었습니다.` });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/landmarks"] });
            onClose();
        } catch (error) {
            toast({ title: "적용 실패", variant: "destructive" });
        } finally {
            setIsApplying(false);
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        AI 자동 도시 탐사 (Dr.'s Engine)
                    </DialogTitle>
                    <DialogDescription>
                        AI가 도시의 숨겨진 명소를 찾고, 300자 이상의 재미있는 이야기를 자동으로 구성합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                        <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                            <SelectTrigger>
                                <SelectValue placeholder="탐사할 도시를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map(city => (
                                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleDiscover} disabled={isDiscovering || !selectedCityId}>
                        {isDiscovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        탐사 시작
                    </Button>
                </div>

                <ScrollArea className="flex-1 mt-4 border rounded-md p-4">
                    {discoveredItems.length === 0 && !isDiscovering && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                            <p>도시를 선택하고 탐사를 시작해보세요.</p>
                        </div>
                    )}

                    {/* [교육용 주석: AI 작업 대기 UI] 
                       AI가 긴 스토리를 생성하는 동안 사용자가 지루하지 않게 
                       진행 상태를 시각적으로 보여주는 것이 중요합니다.
                    */}
                    {isDiscovering && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
                            <p className="font-medium">AI 가이드가 도시를 탐색하며 스토리를 쓰고 있습니다...</p>
                            <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요 (최대 30초 소요)</p>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {discoveredItems.map((item) => (
                            <Card key={item.id} className={`relative overflow-hidden ${selectedIds.has(item.id) ? 'border-primary ring-1 ring-primary' : ''}`}>
                                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id={`check-${item.id}`}
                                            checked={selectedIds.has(item.id)}
                                            onCheckedChange={() => toggleSelection(item.id)}
                                        />
                                        <div>
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                {item.name}
                                                {item.isDuplicate && (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">중복 발견</Badge>
                                                )}
                                                <Badge variant="secondary" className="font-normal">{item.category}</Badge>
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-medium ${item.narration.length >= 300 ? 'text-green-600' : 'text-amber-600'}`}>
                                            {item.narration.length}자 스토리
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="text-sm bg-muted/30 p-3 rounded italic text-muted-foreground line-clamp-3">
                                        "{item.narration}"
                                    </div>

                                    {item.isDuplicate && (
                                        <div className="mt-3 p-3 border border-amber-100 bg-amber-50/30 rounded-lg space-y-2">
                                            <p className="text-xs font-semibold flex items-center gap-1 text-amber-800">
                                                <AlertCircle className="h-3 w-3" />
                                                가이드 선택 (동일 장소 중복)
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant={useAIVersion[item.id] ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => setUseAIVersion({ ...useAIVersion, [item.id]: true })}
                                                >
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    AI 새 가이드 버전
                                                </Button>
                                                <Button
                                                    variant={!useAIVersion[item.id] ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => setUseAIVersion({ ...useAIVersion, [item.id]: false })}
                                                >
                                                    <History className="h-3 w-3 mr-1" />
                                                    기존 가이드 유지
                                                </Button>
                                            </div>
                                            {!useAIVersion[item.id] && (
                                                <p className="text-[10px] text-amber-700 text-center">※ 기존 가이드를 선택하면 이 항목은 업데이트되지 않습니다.</p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <div className="flex-1 flex items-center">
                        <span className="text-sm text-muted-foreground">
                            {selectedIds.size}개 항목 선택됨
                        </span>
                    </div>
                    <Button variant="outline" onClick={onClose}>취소</Button>
                    <Button onClick={handleApply} disabled={isApplying || selectedIds.size === 0}>
                        {isApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        선택 항목 적용
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
