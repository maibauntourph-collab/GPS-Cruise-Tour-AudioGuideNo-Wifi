import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
    registerSW({
        immediate: true,
        onNeedRefresh() {
            // Prompt user to refresh
            console.log('New content available, click on reload button to update.');
        },
        onOfflineReady() {
            console.log('App is ready to work offline.');
        },
    });
}
