import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, UserMinus, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Follow } from "@shared/schema";

export default function Follows() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: follows, isLoading } = useQuery<Follow[]>({
    queryKey: ["/api/follows"],
  });
  
  const { data: followingUsers, isLoading: usersLoading } = useQuery({
      queryKey: ["followed-users", follows],
      queryFn: async () => {
          if (!follows) return [];
          
          const res = await fetch("/api/users");
          if (!res.ok) return [];
          const allUsers = await res.json();
          // Filter to find users that are being followed
          const followingIds = new Set(follows.map(f => f.followingId));
          return allUsers.filter((u: any) => followingIds.has(u.id));
      },
      enabled: !!follows
  });

  const deleteMutation = useMutation({
    mutationFn: async (followingId: string) => {
      await fetch(`/api/follows/${followingId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows"] });
      queryClient.invalidateQueries({ queryKey: ["followed-users"] });
      toast({ title: "Unfollowed" });
    },
  });
  
  const loading = isLoading || usersLoading;

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Following</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {followingUsers?.map((user: any) => (
            <Card key={user.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{user.displayName || user.username || "Unknown User"}</h3>
                        <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(user.id)}
                >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                </Button>
              </CardContent>
            </Card>
          ))}
           {(!followingUsers || followingUsers.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                  You are not following anyone yet.
              </div>
          )}
        </div>
      )}
    </div>
  );
}
