import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, MapPin } from "lucide-react";

export default function RoleSelection() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            GPS 오디오 가이드
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            당신의 역할을 선택하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 가이드 카드 */}
          <Card className="p-8 hover-elevate cursor-pointer transition-all" onClick={() => setLocation("/guide")}>
            <div className="flex flex-col items-center text-center">
              <MapPin className="w-16 h-16 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                가이드
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                지역 정보를 제공하고 관광객들을 안내합니다
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6 text-left">
                <li>✓ 랜드마크 정보 제공</li>
                <li>✓ 음성 안내 활용</li>
                <li>✓ 활동 및 레스토랑 추천</li>
                <li>✓ 카테고리별 필터링</li>
              </ul>
              <Button className="w-full" data-testid="button-select-guide">
                가이드로 시작하기
              </Button>
            </div>
          </Card>

          {/* 인솔자 카드 */}
          <Card className="p-8 hover-elevate cursor-pointer transition-all" onClick={() => setLocation("/tour-leader")}>
            <div className="flex flex-col items-center text-center">
              <Users className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                인솔자
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                투어 그룹을 관리하고 일정을 조율합니다
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6 text-left">
                <li>✓ 그룹 멤버 관리</li>
                <li>✓ 투어 일정 조율</li>
                <li>✓ 시간표 관리</li>
                <li>✓ 진행상황 추적</li>
              </ul>
              <Button className="w-full" data-testid="button-select-tour-leader">
                인솔자로 시작하기
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            나중에 역할을 변경하려면 언제든지 돌아올 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
