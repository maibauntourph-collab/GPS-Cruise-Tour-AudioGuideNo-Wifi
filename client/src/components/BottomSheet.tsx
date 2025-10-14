import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, List, Settings } from 'lucide-react';

interface BottomSheetProps {
  defaultTab?: string;
  translations: {
    list: string;
    details: string;
    settings: string;
  };
  listContent: React.ReactNode;
  detailsContent: React.ReactNode;
  settingsContent: React.ReactNode;
}

const SNAP_POINTS = {
  min: 0.3,
  mid: 0.6,
  max: 0.9,
};

export function BottomSheet({ 
  defaultTab = 'list', 
  translations,
  listContent,
  detailsContent,
  settingsContent
}: BottomSheetProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [height, setHeight] = React.useState(SNAP_POINTS.min);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);
  const startHeight = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startHeight.current = height;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY;
    const viewportHeight = window.innerHeight;
    const deltaHeight = deltaY / viewportHeight;
    
    const newHeight = Math.max(0.2, Math.min(0.95, startHeight.current + deltaHeight));
    setHeight(newHeight);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to nearest point
    const distances = Object.values(SNAP_POINTS).map(point => Math.abs(height - point));
    const minDistance = Math.min(...distances);
    const nearestPoint = Object.values(SNAP_POINTS)[distances.indexOf(minDistance)];
    
    setHeight(nearestPoint);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[10px] border bg-background transition-all duration-300 ease-out"
      style={{ 
        height: `${height * 100}vh`,
        touchAction: 'none',
      }}
      data-testid="bottom-sheet"
    >
      {/* Drag Handle */}
      <div 
        className="flex-shrink-0 py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto h-1.5 w-[80px] rounded-full bg-muted" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pb-3">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2"
                data-testid="tab-list"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.list}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="flex items-center gap-2"
                data-testid="tab-details"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.details}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2"
                data-testid="tab-settings"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.settings}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1 mt-0 overflow-auto">
            {listContent}
          </TabsContent>

          <TabsContent value="details" className="flex-1 mt-0 overflow-auto">
            {detailsContent}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-0 overflow-auto">
            {settingsContent}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
