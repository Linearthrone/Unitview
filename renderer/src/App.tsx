import React, { useState, useEffect } from 'react';
import AuthContainer from './components/auth-container';
import WallpaperMapView from './components/wallpaper-map-view';
import { initializeDatabase, StoreUnavailableError } from './lib/database-simple';
import { determineDataSource } from './lib/data-source';
import { UndoRedoProvider } from './hooks/use-undo-redo';
import { Toaster } from './components/ui/toaster';
import { isWallpaperMode } from './lib/wallpaper-snapshot';

function App() {
  const [isLoading, setIsLoading] = useState(!isWallpaperMode());
  const [error, setError] = useState<string | null>(null);
  const [storeUnavailable, setStoreUnavailable] = useState(false);

  useEffect(() => {
    if (isWallpaperMode()) {
      setIsLoading(false);
      return;
    }

    const initializeApp = async () => {
      try {
        const selectedDataSource = determineDataSource();
        console.log('Setup data source:', selectedDataSource);

        await initializeDatabase();
      } catch (err) {
        console.error('Failed to initialize app:', err);
        if (err instanceof StoreUnavailableError) {
          setStoreUnavailable(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to initialize application');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isWallpaperMode()) {
    return <WallpaperMapView />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-foreground">Loading Unitview...</h2>
          <p className="text-sm text-muted-foreground mt-2">Initializing authentication system</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Initialization Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <UndoRedoProvider initialState={{}}>
      <AuthContainer storeUnavailable={storeUnavailable} />
      <Toaster />
    </UndoRedoProvider>
  );
}

export default App;
