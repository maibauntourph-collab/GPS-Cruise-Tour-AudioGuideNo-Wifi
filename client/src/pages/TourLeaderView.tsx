import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Clock, CheckCircle, MapPin } from "lucide-react";

interface GroupMember {
  id: string;
  name: string;
  status: "on-time" | "late" | "absent";
}

export default function TourLeaderView() {
  const [, setLocation] = useLocation();
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { id: "1", name: "김철수", status: "on-time" },
    { id: "2", name: "이영희", status: "on-time" },
    { id: "3", name: "박준호", status: "late" },
    { id: "4", name: "최민정", status: "on-time" },
  ]);

  const [schedule, setSchedule] = useState([
    { time: "09:00", location: "판테온", duration: "30분" },
    { time: "09:45", location: "트레비 분수", duration: "20분" },
    { time: "10:15", location: "스페인 광장", duration: "25분" },
    { time: "11:00", location: "점심 식사", duration: "60분" },
  ]);

  const onTimeCount = groupMembers.filter(m => m.status === "on-time").length;
  const totalMembers = groupMembers.length;

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
            👥 인솔자 모드
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            투어 일정표
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

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-leader-navigation">
            <TabsTrigger value="members" data-testid="tab-members">
              <Users className="w-4 h-4 mr-2" />
              그룹 멤버
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              <Clock className="w-4 h-4 mr-2" />
              일정표
            </TabsTrigger>
            <TabsTrigger value="status" data-testid="tab-status">
              <CheckCircle className="w-4 h-4 mr-2" />
              상태
            </TabsTrigger>
          </TabsList>

          {/* 그룹 멤버 탭 */}
          <TabsContent value="members" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupMembers.map((member) => (
                <Card
                  key={member.id}
                  className="p-4 flex items-center justify-between hover-elevate"
                  data-testid={`card-member-${member.id}`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {member.id}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.status === "on-time"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : member.status === "late"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    }`}
                  >
                    {member.status === "on-time"
                      ? "정시"
                      : member.status === "late"
                      ? "지연"
                      : "결석"}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 일정표 탭 */}
          <TabsContent value="schedule" className="space-y-3 mt-4">
            {schedule.map((item, idx) => (
              <Card
                key={idx}
                className="p-4 flex items-start gap-4 hover-elevate"
                data-testid={`card-schedule-${idx}`}
              >
                <div className="flex flex-col items-center">
                  <Clock className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.time}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    {item.location}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    소요시간: {item.duration}
                  </p>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* 상태 탭 */}
          <TabsContent value="status" className="mt-4">
            <div className="space-y-4">
              <Card className="p-6 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  투어 진행상황
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                      {onTimeCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      정시 도착
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                      {groupMembers.filter(m => m.status === "late").length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      지연
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-300">
                      {groupMembers.filter(m => m.status === "absent").length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      결석
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  다음 일정
                </h3>
                <div className="flex items-center gap-4">
                  <Clock className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      09:00 - 판테온 방문
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      예상 소요시간: 30분
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
