'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Chrome, Globe, Monitor } from 'lucide-react';

export function BrowserWarning() {
  const [isEdge, setIsEdge] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isEdgeBrowser = userAgent.includes('edg/') || userAgent.includes('edge/');
    
    setIsEdge(isEdgeBrowser);
    setShowWarning(isEdgeBrowser);
  }, []);

  if (!showWarning || !isEdge) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-2">
          <p className="font-semibold">Browser Compatibility Notice</p>
          <p>
            Microsoft Edge has known compatibility issues with Stellar wallet integrations, 
            especially for Soroban transactions. You may experience signing failures.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span>Recommended browsers:</span>
            <div className="flex items-center gap-1">
              <Chrome className="h-4 w-4" />
              <span>Chrome</span>
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="h-4 w-4" />
              <span>Firefox</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>Opera</span>
            </div>
          </div>
          <button 
            onClick={() => setShowWarning(false)}
            className="text-xs text-amber-600 hover:text-amber-800 underline"
          >
            Dismiss
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
