import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getSessionId } from '@/lib/sessionUtils';

interface VisitedLandmark {
  id: string;
  landmarkId: string;
  visitedAt: string;
  sessionId: string | null;
}

export function useVisitedLandmarks() {
  const sessionId = getSessionId();

  const { data: visitedLandmarks = [] } = useQuery<VisitedLandmark[]>({
    queryKey: ['/api/visited', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/visited?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch visited landmarks');
      return response.json();
    },
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['/api/visited/count', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/visited/count?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch visited count');
      return response.json();
    },
  });

  const markVisitedMutation = useMutation({
    mutationFn: async (landmarkId: string) => {
      return apiRequest('POST', '/api/visited', { landmarkId, sessionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visited'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visited/count'] });
    },
  });

  const isLandmarkVisited = (landmarkId: string): boolean => {
    return visitedLandmarks.some((v) => v.landmarkId === landmarkId);
  };

  return {
    visitedLandmarks,
    visitedCount: countData?.count || 0,
    markVisited: markVisitedMutation.mutate,
    isVisited: isLandmarkVisited,
    isMarking: markVisitedMutation.isPending,
  };
}
