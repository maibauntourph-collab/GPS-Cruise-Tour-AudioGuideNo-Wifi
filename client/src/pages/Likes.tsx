import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Heart, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Like } from "@shared/schema";

export default function Likes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: likes, isLoading: likesLoading } = useQuery<Like[]>({
    queryKey: ["/api/likes"],
  });

  const { data: landmarks, isLoading: landmarksLoading } = useQuery({
    queryKey: ["liked-landmarks", likes],
    queryFn: async () => {
      if (!likes) return [];
      const landmarkLikes = likes.filter(l => l.targetType === 'landmark');
      if (landmarkLikes.length === 0) return [];
      
      const promises = landmarkLikes.map(l => 
        fetch(`/api/landmarks/${l.targetId}`).then(res => {
            if (!res.ok) return null;
            return res.json();
        })
      );
      
      const results = await Promise.all(promises);
      return results.filter(r => r !== null);
    },
    enabled: !!likes,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ targetId, targetType }: { targetId: string, targetType: string }) => {
      await fetch(`/api/likes?targetId=${targetId}&targetType=${targetType}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/likes"] });
      queryClient.invalidateQueries({ queryKey: ["liked-landmarks"] });
      toast({ title: "Removed from likes" });
    },
  });

  const isLoading = likesLoading || landmarksLoading;

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">My Likes</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {landmarks?.map((landmark: any) => (
            <Card key={landmark.id} className="overflow-hidden">
                <div className="h-48 bg-muted relative">
                    {landmark.photos?.[0] && (
                        <img 
                            src={landmark.photos[0]} 
                            alt={landmark.name} 
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-lg">{landmark.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {landmark.description?.substring(0, 50)}...
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate({ targetId: landmark.id, targetType: 'landmark' })}
                    >
                        <Heart className="h-5 w-5 fill-current" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!landmarks || landmarks.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                  No likes yet. Go explore and like some places!
              </div>
          )}
        </div>
      )}
    </div>
  );
}
