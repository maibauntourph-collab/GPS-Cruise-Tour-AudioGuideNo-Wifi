import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LogOut, LogIn, User, Link2, ChevronRight } from 'lucide-react';
import { SiGoogle, SiFacebook, SiNaver, SiKakaotalk, SiApple, SiLine } from 'react-icons/si';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { t } from '@/lib/translations';

interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatar: string | null;
  locale: string | null;
  role: string | null;
}

interface AuthResponse {
  user: AuthUser | null;
  linkedProviders?: string[];
}

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

const PROVIDER_CONFIG = {
  google: {
    name: 'Google',
    icon: SiGoogle,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    iconColor: 'text-[#4285F4]'
  },
  facebook: {
    name: 'Facebook', 
    icon: SiFacebook,
    color: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
    iconColor: 'text-white'
  },
  kakao: {
    name: 'Kakao',
    icon: SiKakaotalk,
    color: 'bg-[#FEE500] hover:bg-[#FDD800] text-[#000000D9]',
    iconColor: 'text-[#000000D9]'
  },
  naver: {
    name: 'Naver',
    icon: SiNaver,
    color: 'bg-[#03C75A] hover:bg-[#02B351] text-white',
    iconColor: 'text-white'
  },
  apple: {
    name: 'Apple',
    icon: SiApple,
    color: 'bg-black hover:bg-gray-900 text-white',
    iconColor: 'text-white'
  },
  line: {
    name: 'LINE',
    icon: SiLine,
    color: 'bg-[#00B900] hover:bg-[#00A800] text-white',
    iconColor: 'text-white'
  }
};

export default function LoginDialog({ isOpen, onClose, language }: LoginDialogProps) {
  const { data: authData, isLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me']
  });

  const { data: providersData } = useQuery<{ providers: string[] }>({
    queryKey: ['/api/auth/providers']
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  const handleLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const availableProviders = providersData?.providers || [];
  const user = authData?.user;
  const linkedProviders = authData?.linkedProviders || [];

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, Record<string, string>> = {
      google: { en: 'Continue with Google', ko: 'Google로 계속하기', ja: 'Googleで続ける', zh: '使用Google继续' },
      facebook: { en: 'Continue with Facebook', ko: 'Facebook으로 계속하기', ja: 'Facebookで続ける', zh: '使用Facebook继续' },
      kakao: { en: 'Continue with Kakao', ko: '카카오로 계속하기', ja: 'Kakaoで続ける', zh: '使用Kakao继续' },
      naver: { en: 'Continue with Naver', ko: '네이버로 계속하기', ja: 'Naverで続ける', zh: '使用Naver继续' },
      apple: { en: 'Continue with Apple', ko: 'Apple로 계속하기', ja: 'Appleで続ける', zh: '使用Apple继续' },
      line: { en: 'Continue with LINE', ko: 'LINE으로 계속하기', ja: 'LINEで続ける', zh: '使用LINE继续' }
    };
    return labels[provider]?.[language] || labels[provider]?.['en'] || `Continue with ${provider}`;
  };

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: { en: 'Account', ko: '계정', ja: 'アカウント', zh: '账户' },
      loginTitle: { en: 'Sign In', ko: '로그인', ja: 'サインイン', zh: '登录' },
      loginDesc: { en: 'Sign in to sync your progress across devices', ko: '기기 간 진행 상황을 동기화하려면 로그인하세요', ja: 'デバイス間で進捗を同期するにはサインインしてください', zh: '登录以在设备间同步进度' },
      profile: { en: 'Profile', ko: '프로필', ja: 'プロフィール', zh: '个人资料' },
      linkedAccounts: { en: 'Linked Accounts', ko: '연결된 계정', ja: '連携済みアカウント', zh: '已关联账户' },
      linkMore: { en: 'Link more accounts', ko: '더 많은 계정 연결', ja: 'アカウントを追加', zh: '关联更多账户' },
      logout: { en: 'Sign Out', ko: '로그아웃', ja: 'サインアウト', zh: '退出登录' },
      guest: { en: 'Guest', ko: '게스트', ja: 'ゲスト', zh: '访客' }
    };
    return texts[key]?.[language] || texts[key]?.['en'] || key;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {user ? getText('title') : getText('loginTitle')}
          </DialogTitle>
          {!user && (
            <DialogDescription>
              {getText('loginDesc')}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate" data-testid="text-user-name">
                  {user.displayName || getText('guest')}
                </p>
                {user.email && (
                  <p className="text-sm text-muted-foreground truncate" data-testid="text-user-email">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            {linkedProviders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  {getText('linkedAccounts')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {linkedProviders.map(provider => {
                    const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <div 
                        key={provider}
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                        data-testid={`badge-provider-${provider}`}
                      >
                        <Icon className="w-4 h-4" />
                        {config.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {availableProviders.filter(p => !linkedProviders.includes(p)).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {getText('linkMore')}
                  </p>
                  <div className="grid gap-2">
                    {availableProviders
                      .filter(p => !linkedProviders.includes(p))
                      .map(provider => {
                        const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <Button
                            key={provider}
                            variant="outline"
                            className="justify-start gap-3"
                            onClick={() => handleLogin(provider)}
                            data-testid={`button-link-${provider}`}
                          >
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                            <span className="flex-1 text-left">{config.name}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {getText('logout')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {availableProviders.map(provider => {
              const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <Button
                  key={provider}
                  className={`w-full justify-start gap-3 h-12 text-base ${config.color}`}
                  onClick={() => handleLogin(provider)}
                  data-testid={`button-login-${provider}`}
                >
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  {getProviderLabel(provider)}
                </Button>
              );
            })}

            {availableProviders.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {language === 'ko' ? '설정된 로그인 제공자가 없습니다' : 'No login providers configured'}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
