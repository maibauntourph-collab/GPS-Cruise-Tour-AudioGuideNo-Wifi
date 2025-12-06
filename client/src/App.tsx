import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Loader2 } from "lucide-react";
import RoleSelection from "@/pages/RoleSelection";
import NotFound from "@/pages/not-found";

// Lazy load heavy components for code splitting
const Home = lazy(() => import("@/pages/Home"));
const Admin = lazy(() => import("@/pages/Admin"));
const GuideView = lazy(() => import("@/pages/GuideView"));
const TourLeaderView = lazy(() => import("@/pages/TourLeaderView"));

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
        <Route path="/" component={RoleSelection}/>
        <Route path="/home" component={Home}/>
        <Route path="/guide" component={GuideView}/>
        <Route path="/tour-leader" component={TourLeaderView}/>
        <Route path="/admin" component={Admin}/>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Initialize service worker for offline support (only in production)
  useServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen w-full">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
