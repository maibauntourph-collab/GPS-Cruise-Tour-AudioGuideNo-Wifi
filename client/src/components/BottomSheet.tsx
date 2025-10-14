import { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
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

export function BottomSheet({ 
  defaultTab = 'list', 
  translations,
  listContent,
  detailsContent,
  settingsContent
}: BottomSheetProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.3);

  return (
    <Drawer
      open={true}
      modal={false}
      dismissible={false}
      snapPoints={[0.3, 0.6, 0.9]}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={setSnapPoint}
      data-testid="bottom-sheet"
    >
      <DrawerContent 
        className="h-[90vh] max-h-[90vh] border-none outline-none"
        data-testid="bottom-sheet-content"
      >
        <div className="h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 px-4 pt-2 pb-3">
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
      </DrawerContent>
    </Drawer>
  );
}
