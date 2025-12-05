import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Home from "./Home";

export default function GuideView() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative h-screen w-full">
      {/* 역할 표시 및 뒤로가기 */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
            👤 가이드 모드
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

      {/* 가이드용 Home 페이지 */}
      <div className="h-full">
        <Home />
      </div>

      {/* 가이드 팁 패널 (선택사항) */}
      <div className="absolute bottom-4 right-4 max-w-xs hidden lg:block">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 가이드 팁
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• 카테고리 필터로 관광지를 쉽게 정렬하세요</li>
            <li>• 왼쪽 카드에서 세부 정보를 확인하세요</li>
            <li>• 음성 안내를 활용해 관광객을 인도하세요</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
