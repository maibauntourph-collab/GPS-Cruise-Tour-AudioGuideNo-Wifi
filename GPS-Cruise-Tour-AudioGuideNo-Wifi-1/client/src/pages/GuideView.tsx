import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, MapPin, Utensils, Gift, Activity } from "lucide-react";
import { LandmarkFormDialog } from "@/components/LandmarkFormDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DbCity, DbLandmark } from "@shared/schema";
import Home from "./Home";

export default function GuideView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: cities = [] } = useQuery<DbCity[]>({
    queryKey: ['/api/cities'],
    queryFn: async () => {
      const res = await fetch('/api/cities');
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<DbLandmark>) => {
      return apiRequest('POST', '/api/admin/landmarks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/landmarks'] });
      setIsAddDialogOpen(false);
      toast({
        title: "장소 추가 완료",
        description: "새 장소가 성공적으로 추가되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const openAddDialog = (category: string) => {
    setSelectedCategory(category);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="relative h-screen w-full">
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
            가이드 모드
          </div>
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

      <div className="h-full">
        <Home />
      </div>

      <div className="absolute bottom-4 right-4 max-w-xs z-40">
        <Card className="p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur border shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            장소 추가하기
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddDialog("Monuments")}
              className="flex items-center gap-1 text-xs"
              data-testid="button-add-landmark"
            >
              <MapPin className="w-3 h-3 text-terracotta-600" />
              명소
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddDialog("Activity")}
              className="flex items-center gap-1 text-xs"
              data-testid="button-add-activity"
            >
              <Activity className="w-3 h-3 text-blue-600" />
              액티비티
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddDialog("Restaurant")}
              className="flex items-center gap-1 text-xs"
              data-testid="button-add-restaurant"
            >
              <Utensils className="w-3 h-3 text-orange-600" />
              식당
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddDialog("Gift Shop")}
              className="flex items-center gap-1 text-xs"
              data-testid="button-add-giftshop"
            >
              <Gift className="w-3 h-3 text-yellow-600" />
              기념품
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            새로운 장소를 추가하면 지도에 바로 표시됩니다
          </p>
        </Card>
      </div>

      <LandmarkFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        landmark={null}
        cities={cities}
        onSave={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        defaultCategory={selectedCategory}
      />
    </div>
  );
}
