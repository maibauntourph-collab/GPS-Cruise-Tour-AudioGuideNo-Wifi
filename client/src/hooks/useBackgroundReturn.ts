import { useEffect, useState } from 'react';
import { t } from '@/lib/translations';

/**
 * PWA 환경에서 앱이 백그라운드로 전환될 때 복귀할 수 있도록 돕는 Hook입니다.
 * 1. Web Notification API를 사용하여 "되돌아가기" 알림을 표시합니다.
 * 2. (데스크톱 한정) Document Picture-in-Picture API를 통해 플로팅 아이콘을 띄우는 기능도 지원 가능합니다.
 */
export function useBackgroundReturn(selectedLanguage: string = 'en') {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // 알림 권한 상태 확인
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        }
        return 'denied';
    };

    useEffect(() => {
        let activeNotification: any = null;

        const showReturnNotification = async () => {
            if (document.hidden && permission === 'granted') {
                const title = t('returnToApp', selectedLanguage) || 'Kenneth Cruise Guide';
                const bodyText = selectedLanguage === 'ko' ? '터치하여 앱으로 돌아오세요 / 오디오 계속 재생 중' : 'Tap to return to the app / Audio playing in background';

                const options = {
                    body: bodyText,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-72x72.png',
                    tag: 'return-to-app', // 중복 방지 태그
                    requireInteraction: true, // 즉시 사라지지 않도록
                };

                try {
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.showNotification(title, options);
                    } else {
                        activeNotification = new Notification(title, options);
                        activeNotification.onclick = () => {
                            window.focus();
                            activeNotification.close();
                        };
                    }
                } catch (e) {
                    console.error('Notification show failed:', e);
                }
            } else if (!document.hidden) {
                // 앱으로 돌아오면 알림 닫기
                if (activeNotification) activeNotification.close();
                if ('serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        const notifications = await registration.getNotifications({ tag: 'return-to-app' });
                        notifications.forEach(n => n.close());
                    } catch (e) {
                        console.error('Failed to clear notifications:', e);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', showReturnNotification);
        return () => {
            document.removeEventListener('visibilitychange', showReturnNotification);
            if (activeNotification) activeNotification.close();
        };
    }, [permission, selectedLanguage]);

    return { permission, requestPermission };
}
