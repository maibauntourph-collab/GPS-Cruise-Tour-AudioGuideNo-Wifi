import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import RoleSelection from "@/pages/RoleSelection";
import GuideView from "@/pages/GuideView";
import TourLeaderView from "@/pages/TourLeaderView";

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelection}/>
      <Route path="/home" component={Home}/>
      <Route path="/guide" component={GuideView}/>
      <Route path="/tour-leader" component={TourLeaderView}/>
      <Route path="/admin" component={Admin}/>
      <Route component={NotFound} />
    </Switch>
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
