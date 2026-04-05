import { Switch, Route } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Loader2, ArrowLeft, Minimize2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "@/context/LanguageContext";

// Lazy load heavy components for code splitting
const Home = lazy(() => import("@/pages/Home"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLanding = lazy(() => import("@/pages/AdminLanding_20260221_0625"));
const GuideView = lazy(() => import("@/pages/GuideView"));
const TourLeaderView = lazy(() => import("@/pages/TourLeaderView"));
const MyRoutes = lazy(() => import("./pages/MyRoutes"));
const ProductList = lazy(() => import("./pages/ProductList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
import DesignPreview from "@/pages/DesignPreview";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import PhotoManager from "@/pages/admin/PhotoManager";
import NarrationManager from "@/pages/admin/NarrationManager";
import PlacesManager from "@/pages/admin/PlacesManager";
import AIKeyManager from "@/pages/admin/AIKeyManager";
import WorkflowView from "@/pages/admin/WorkflowView";

import Likes from "@/pages/Likes";
import Follows from "@/pages/Follows";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground">로딩 중...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/guide" component={GuideView} />
        <Route path="/tour-leader" component={TourLeaderView} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/" component={AdminDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/dashboard/" component={AdminDashboard} />
        <Route path="/admin/photos" component={PhotoManager} />
        <Route path="/admin/narration" component={NarrationManager} />
        <Route path="/admin/places" component={PlacesManager} />
        <Route path="/admin/ai-keys" component={AIKeyManager} />
        <Route path="/admin/workflow" component={WorkflowView} />
        <Route path="/my-routes" component={MyRoutes} />
        <Route path="/products" component={ProductList} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/design-preview" component={DesignPreview} />
        <Route path="/likes" component={Likes} />
        <Route path="/follows" component={Follows} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Initialize service worker for offline support (only in production)
  useServiceWorker();

  const [showReturnToApp, setShowReturnToApp] = useState(false);
  const [showOpenInBrowserTip, setShowOpenInBrowserTip] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isSNSWebview = /KAKAOTALK|KAKAO|Line|WhatsApp|Instagram|FBAN|FBAV|Naver|SamsungBrowser/i.test(ua);

    const AUTO_REDIRECT_KEY = 'sns-webview-auto-redirect';
    const shouldAutoRedirect = isSNSWebview && !localStorage.getItem(AUTO_REDIRECT_KEY);

    if (isSNSWebview) {
      setShowOpenInBrowserTip(true);
    }

    if (shouldAutoRedirect) {
      localStorage.setItem(AUTO_REDIRECT_KEY, 'true');
      setTimeout(() => openInExternalBrowser(), 500);
    }

    const updateState = () => {
      setShowReturnToApp(localStorage.getItem('showReturnToApp') === 'true');
    };

    updateState();

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'showReturnToApp') {
        updateState();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const openInExternalBrowser = () => {
    const currentUrl = window.location.href;
    const ua = navigator.userAgent || '';

    if (/Android/i.test(ua)) {
      const intentUrl = currentUrl.replace(/^https?:\/\//, '');
      window.location.href = `intent://${intentUrl}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
      return;
    }

    if (/iPhone|iPad|iPod/i.test(ua)) {
      window.location.href = `googlechrome://navigate?url=${encodeURIComponent(currentUrl)}`;
      setTimeout(() => window.open(currentUrl, '_blank', 'noopener,noreferrer'), 700);
      return;
    }

    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReturnApp = () => {
    localStorage.setItem('showReturnToApp', 'false');
    setShowReturnToApp(false);
    window.location.href = '/home';
    window.focus();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <div className="flex h-screen w-full relative">
            <Router />
            {showOpenInBrowserTip && (
              <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs font-bold rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                <span>Open in browser for better experience.</span>
                <button
                  onClick={openInExternalBrowser}
                  className="text-blue-600 underline font-bold"
                >
                  Open
                </button>
                <button
                  onClick={() => setShowOpenInBrowserTip(false)}
                  className="text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
            {showReturnToApp && (
              <button
                onClick={handleReturnApp}
                className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-white/95 shadow-xl border border-primary px-4 py-2 hover:bg-white"
                title="Return to guide app"
              >
                <Minimize2 className="w-5 h-5 text-primary" />
                <span className="text-sm text-primary font-bold">Return</span>
              </button>
            )}
          </div>
          <Toaster />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}


export default App;
