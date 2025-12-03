import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeft,
  Globe,
  Save,
  Loader2,
  LayoutDashboard,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { City, Landmark } from '@shared/schema';

interface DbCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  zoom: number | null;
  cruisePort: any;
  createdAt: string;
  updatedAt: string;
}

interface DbLandmark {
  id: string;
  cityId: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  narration: string;
  description: string | null;
  category: string | null;
  detailedDescription: string | null;
  photos: string[] | null;
  historicalInfo: string | null;
  yearBuilt: string | null;
  architect: string | null;
  translations: any;
  openingHours: string | null;
  priceRange: string | null;
  cuisine: string | null;
  reservationUrl: string | null;
  phoneNumber: string | null;
  menuHighlights: string[] | null;
  restaurantPhotos: any;
  paymentMethods: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  
  const [editingCity, setEditingCity] = useState<DbCity | null>(null);
  const [editingLandmark, setEditingLandmark] = useState<DbLandmark | null>(null);
  const [isCreateCityOpen, setIsCreateCityOpen] = useState(false);
  const [isCreateLandmarkOpen, setIsCreateLandmarkOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'city' | 'landmark'; id: string; name: string } | null>(null);
  
  // Import/Export state
  const [importType, setImportType] = useState<'cities' | 'landmarks'>('cities');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; total: number; errors?: { row: number; message: string }[] } | null>(null);

  const { data: cities = [], isLoading: loadingCities } = useQuery<DbCity[]>({
    queryKey: ['/api/admin/cities']
  });

  const { data: landmarks = [], isLoading: loadingLandmarks } = useQuery<DbLandmark[]>({
    queryKey: ['/api/admin/landmarks']
  });

  const { data: stats } = useQuery<{ cities: number; landmarks: number; categories: Record<string, number> }>({
    queryKey: ['/api/admin/stats']
  });

  const createCityMutation = useMutation({
    mutationFn: (data: Partial<DbCity>) => apiRequest('POST', '/api/admin/cities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsCreateCityOpen(false);
      toast({ title: 'City created successfully' });
    },
    onError: () => toast({ title: 'Failed to create city', variant: 'destructive' })
  });

  const updateCityMutation = useMutation({
    mutationFn: (data: Partial<DbCity>) => apiRequest('PUT', `/api/admin/cities/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cities'] });
      setEditingCity(null);
      toast({ title: 'City updated successfully' });
    },
    onError: () => toast({ title: 'Failed to update city', variant: 'destructive' })
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/cities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDeleteConfirm(null);
      toast({ title: 'City deleted successfully' });
    },
    onError: () => toast({ title: 'Failed to delete city', variant: 'destructive' })
  });

  const createLandmarkMutation = useMutation({
    mutationFn: (data: Partial<DbLandmark>) => apiRequest('POST', '/api/admin/landmarks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/landmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsCreateLandmarkOpen(false);
      toast({ title: 'Landmark created successfully' });
    },
    onError: () => toast({ title: 'Failed to create landmark', variant: 'destructive' })
  });

  const updateLandmarkMutation = useMutation({
    mutationFn: (data: Partial<DbLandmark>) => apiRequest('PUT', `/api/admin/landmarks/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/landmarks'] });
      setEditingLandmark(null);
      toast({ title: 'Landmark updated successfully' });
    },
    onError: () => toast({ title: 'Failed to update landmark', variant: 'destructive' })
  });

  const deleteLandmarkMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/landmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/landmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDeleteConfirm(null);
      toast({ title: 'Landmark deleted successfully' });
    },
    onError: () => toast({ title: 'Failed to delete landmark', variant: 'destructive' })
  });

  const filteredLandmarks = landmarks.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCityFilter === 'all' || l.cityId === selectedCityFilter;
    return matchesSearch && matchesCity;
  });

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background w-full">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Tour Admin</h1>
          </div>
          <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="cities" data-testid="tab-cities">
              <Building2 className="h-4 w-4 mr-2" />
              Cities ({cities.length})
            </TabsTrigger>
            <TabsTrigger value="landmarks" data-testid="tab-landmarks">
              <MapPin className="h-4 w-4 mr-2" />
              Landmarks ({landmarks.length})
            </TabsTrigger>
            <TabsTrigger value="import-export" data-testid="tab-import-export">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import/Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stats-cities">{stats?.cities || cities.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Landmarks</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stats-landmarks">{stats?.landmarks || landmarks.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stats-categories">
                    {stats?.categories ? Object.keys(stats.categories).length : 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats?.categories && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Landmarks by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-4">
                    {Object.entries(stats.categories).map(([category, count]) => (
                      <div key={category} className="flex justify-between p-2 rounded bg-muted">
                        <span className="text-sm">{category || 'Uncategorized'}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cities">
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-cities"
                />
              </div>
              <Button onClick={() => setIsCreateCityOpen(true)} data-testid="button-add-city">
                <Plus className="h-4 w-4 mr-2" />
                Add City
              </Button>
            </div>

            {loadingCities ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCities.map((city) => (
                  <Card key={city.id} data-testid={`city-card-${city.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{city.name}</CardTitle>
                          <CardDescription>{city.country}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingCity(city)} data-testid={`edit-city-${city.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'city', id: city.id, name: city.name })} data-testid={`delete-city-${city.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>ID: {city.id}</p>
                        <p>Coordinates: {city.lat.toFixed(4)}, {city.lng.toFixed(4)}</p>
                        <p>Landmarks: {landmarks.filter(l => l.cityId === city.id).length}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="landmarks">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search landmarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-landmarks"
                />
              </div>
              <Select value={selectedCityFilter} onValueChange={setSelectedCityFilter}>
                <SelectTrigger className="w-48" data-testid="select-city-filter">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button onClick={() => setIsCreateLandmarkOpen(true)} data-testid="button-add-landmark">
                <Plus className="h-4 w-4 mr-2" />
                Add Landmark
              </Button>
            </div>

            {loadingLandmarks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLandmarks.map((landmark) => (
                  <Card key={landmark.id} className="p-4" data-testid={`landmark-card-${landmark.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{landmark.name}</h3>
                          {landmark.category && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted">{landmark.category}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {cities.find(c => c.id === landmark.cityId)?.name || landmark.cityId} • 
                          {landmark.lat.toFixed(4)}, {landmark.lng.toFixed(4)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingLandmark(landmark)} data-testid={`edit-landmark-${landmark.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'landmark', id: landmark.id, name: landmark.name })} data-testid={`delete-landmark-${landmark.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import-export">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Data
                  </CardTitle>
                  <CardDescription>
                    Upload Excel (.xlsx) or CSV files to bulk import cities or landmarks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data Type</Label>
                    <Select value={importType} onValueChange={(v: 'cities' | 'landmarks') => setImportType(v)}>
                      <SelectTrigger data-testid="select-import-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cities">Cities</SelectItem>
                        <SelectItem value="landmarks">Landmarks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select File</Label>
                    <Input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={(e) => {
                        setImportFile(e.target.files?.[0] || null);
                        setImportResult(null);
                      }}
                      data-testid="input-import-file"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports .xlsx and .csv files up to 5MB (max 5,000 rows)
                    </p>
                  </div>

                  <Button
                    onClick={async () => {
                      if (!importFile) return;
                      setImporting(true);
                      setImportResult(null);
                      
                      const formData = new FormData();
                      formData.append('file', importFile);
                      formData.append('type', importType);
                      
                      try {
                        const response = await fetch('/api/admin/import', {
                          method: 'POST',
                          body: formData
                        });
                        const result = await response.json();
                        
                        if (!response.ok) {
                          setImportResult({ success: false, imported: 0, total: 0, errors: [{ row: 0, message: result.error }] });
                        } else {
                          setImportResult(result);
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/cities'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/landmarks'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
                        }
                      } catch (error) {
                        setImportResult({ success: false, imported: 0, total: 0, errors: [{ row: 0, message: 'Failed to upload file' }] });
                      }
                      setImporting(false);
                    }}
                    disabled={!importFile || importing}
                    className="w-full"
                    data-testid="button-import"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {importType === 'cities' ? 'Cities' : 'Landmarks'}
                      </>
                    )}
                  </Button>

                  {importResult && (
                    <Alert variant={importResult.errors?.length ? 'destructive' : 'default'}>
                      {importResult.errors?.length ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {importResult.errors?.length ? 'Import completed with errors' : 'Import successful'}
                      </AlertTitle>
                      <AlertDescription>
                        <p>Imported {importResult.imported} of {importResult.total} rows</p>
                        {importResult.errors && importResult.errors.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-auto text-xs space-y-1">
                            {importResult.errors.slice(0, 10).map((err, i) => (
                              <p key={i}>Row {err.row}: {err.message}</p>
                            ))}
                            {importResult.errors.length > 10 && (
                              <p className="text-muted-foreground">...and {importResult.errors.length - 10} more errors</p>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Export & Templates Section */}
              <div className="space-y-6">
                {/* Download Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileDown className="h-5 w-5" />
                      Download Templates
                    </CardTitle>
                    <CardDescription>
                      Download sample files with the correct format for importing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open('/api/admin/template?type=cities&format=xlsx', '_blank')}
                        data-testid="button-template-cities-xlsx"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Cities Template (.xlsx)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open('/api/admin/template?type=cities&format=csv', '_blank')}
                        data-testid="button-template-cities-csv"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Cities Template (.csv)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open('/api/admin/template?type=landmarks&format=xlsx', '_blank')}
                        data-testid="button-template-landmarks-xlsx"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Landmarks Template (.xlsx)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open('/api/admin/template?type=landmarks&format=csv', '_blank')}
                        data-testid="button-template-landmarks-csv"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Landmarks Template (.csv)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Current Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Current Data
                    </CardTitle>
                    <CardDescription>
                      Download all existing cities or landmarks data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        onClick={() => window.open('/api/admin/export?type=cities&format=xlsx', '_blank')}
                        data-testid="button-export-cities-xlsx"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Cities (.xlsx)
                      </Button>
                      <Button
                        onClick={() => window.open('/api/admin/export?type=cities&format=csv', '_blank')}
                        data-testid="button-export-cities-csv"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Cities (.csv)
                      </Button>
                      <Button
                        onClick={() => window.open('/api/admin/export?type=landmarks&format=xlsx', '_blank')}
                        data-testid="button-export-landmarks-xlsx"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Landmarks (.xlsx)
                      </Button>
                      <Button
                        onClick={() => window.open('/api/admin/export?type=landmarks&format=csv', '_blank')}
                        data-testid="button-export-landmarks-csv"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Landmarks (.csv)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <CityFormDialog
        isOpen={isCreateCityOpen || !!editingCity}
        onClose={() => { setIsCreateCityOpen(false); setEditingCity(null); }}
        city={editingCity}
        onSave={(data) => editingCity ? updateCityMutation.mutate(data) : createCityMutation.mutate(data)}
        isPending={createCityMutation.isPending || updateCityMutation.isPending}
      />

      <LandmarkFormDialog
        isOpen={isCreateLandmarkOpen || !!editingLandmark}
        onClose={() => { setIsCreateLandmarkOpen(false); setEditingLandmark(null); }}
        landmark={editingLandmark}
        cities={cities}
        onSave={(data) => editingLandmark ? updateLandmarkMutation.mutate(data) : createLandmarkMutation.mutate(data)}
        isPending={createLandmarkMutation.isPending || updateLandmarkMutation.isPending}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (deleteConfirm?.type === 'city') {
                  deleteCityMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'landmark') {
                  deleteLandmarkMutation.mutate(deleteConfirm.id);
                }
              }}
              disabled={deleteCityMutation.isPending || deleteLandmarkMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {(deleteCityMutation.isPending || deleteLandmarkMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: DbCity | null;
  onSave: (data: Partial<DbCity>) => void;
  isPending: boolean;
}

function CityFormDialog({ isOpen, onClose, city, onSave, isPending }: CityFormDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    country: '',
    lat: 0,
    lng: 0,
    zoom: 14
  });

  useEffect(() => {
    if (isOpen) {
      if (city) {
        setFormData({
          id: city.id,
          name: city.name,
          country: city.country,
          lat: city.lat,
          lng: city.lng,
          zoom: city.zoom || 14
        });
      } else {
        setFormData({ id: '', name: '', country: '', lat: 0, lng: 0, zoom: 14 });
      }
    }
  }, [isOpen, city]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-city-form">
        <DialogHeader>
          <DialogTitle>{city ? 'Edit City' : 'Add New City'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city-id">City ID</Label>
            <Input
              id="city-id"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="e.g., tokyo"
              disabled={!!city}
              required
              data-testid="input-city-id"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city-name">Name</Label>
            <Input
              id="city-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Tokyo"
              required
              data-testid="input-city-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city-country">Country</Label>
            <Input
              id="city-country"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="e.g., Japan"
              required
              data-testid="input-city-country"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city-lat">Latitude</Label>
              <Input
                id="city-lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                required
                data-testid="input-city-lat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city-lng">Longitude</Label>
              <Input
                id="city-lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                required
                data-testid="input-city-lng"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-city">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface LandmarkFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  landmark: DbLandmark | null;
  cities: DbCity[];
  onSave: (data: Partial<DbLandmark>) => void;
  isPending: boolean;
}

function LandmarkFormDialog({ isOpen, onClose, landmark, cities, onSave, isPending }: LandmarkFormDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    cityId: '',
    name: '',
    lat: 0,
    lng: 0,
    radius: 50,
    narration: '',
    description: '',
    category: '',
    detailedDescription: '',
    yearBuilt: '',
    architect: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (landmark) {
        setFormData({
          id: landmark.id,
          cityId: landmark.cityId,
          name: landmark.name,
          lat: landmark.lat,
          lng: landmark.lng,
          radius: landmark.radius,
          narration: landmark.narration,
          description: landmark.description || '',
          category: landmark.category || '',
          detailedDescription: landmark.detailedDescription || '',
          yearBuilt: landmark.yearBuilt || '',
          architect: landmark.architect || ''
        });
      } else {
        setFormData({
          id: '', cityId: cities[0]?.id || '', name: '', lat: 0, lng: 0,
          radius: 50, narration: '', description: '', category: '',
          detailedDescription: '', yearBuilt: '', architect: ''
        });
      }
    }
  }, [isOpen, landmark, cities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-landmark-form">
        <DialogHeader>
          <DialogTitle>{landmark ? 'Edit Landmark' : 'Add New Landmark'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark-id">Landmark ID</Label>
              <Input
                id="landmark-id"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="e.g., tokyo_tower"
                disabled={!!landmark}
                required
                data-testid="input-landmark-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-city">City</Label>
              <Select value={formData.cityId} onValueChange={(v) => setFormData(prev => ({ ...prev, cityId: v }))}>
                <SelectTrigger data-testid="select-landmark-city">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-name">Name</Label>
            <Input
              id="landmark-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Tokyo Tower"
              required
              data-testid="input-landmark-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-category">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger data-testid="select-landmark-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ancient Rome">Ancient Rome</SelectItem>
                <SelectItem value="Religious">Religious</SelectItem>
                <SelectItem value="Monuments">Monuments</SelectItem>
                <SelectItem value="Piazzas">Piazzas</SelectItem>
                <SelectItem value="Museums">Museums</SelectItem>
                <SelectItem value="Activity">Activity</SelectItem>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="Gift Shop">Gift Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark-lat">Latitude</Label>
              <Input
                id="landmark-lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                required
                data-testid="input-landmark-lat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-lng">Longitude</Label>
              <Input
                id="landmark-lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                required
                data-testid="input-landmark-lng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-radius">Radius (m)</Label>
              <Input
                id="landmark-radius"
                type="number"
                value={formData.radius}
                onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) || 50 }))}
                required
                data-testid="input-landmark-radius"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-narration">Narration (Audio Text)</Label>
            <Textarea
              id="landmark-narration"
              value={formData.narration}
              onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
              placeholder="Text that will be spoken when user approaches this landmark..."
              rows={3}
              required
              data-testid="input-landmark-narration"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-description">Short Description</Label>
            <Textarea
              id="landmark-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description shown on the map marker..."
              rows={2}
              data-testid="input-landmark-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-detailed">Detailed Description</Label>
            <Textarea
              id="landmark-detailed"
              value={formData.detailedDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, detailedDescription: e.target.value }))}
              placeholder="Long-form content for the detail panel..."
              rows={5}
              data-testid="input-landmark-detailed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark-year">Year Built</Label>
              <Input
                id="landmark-year"
                value={formData.yearBuilt}
                onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: e.target.value }))}
                placeholder="e.g., 1958"
                data-testid="input-landmark-year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-architect">Architect</Label>
              <Input
                id="landmark-architect"
                value={formData.architect}
                onChange={(e) => setFormData(prev => ({ ...prev, architect: e.target.value }))}
                placeholder="e.g., Tachū Naitō"
                data-testid="input-landmark-architect"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-landmark">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
