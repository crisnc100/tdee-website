'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

export default function SimplePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  // Track PWA analytics
  const trackAnalytics = async (event: string, extraData: any = {}) => {
    try {
      const platform = isIOS ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop';
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      
      await fetch('/api/analytics/pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          platform,
          standalone,
          ...extraData
        })
      });
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  };

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Check if iOS
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(checkIOS);
    
    // Track app launch
    if (window.matchMedia('(display-mode: standalone)').matches) {
      trackAnalytics('app_launch');
    }
    
    // Show iOS banner if on iOS and not in standalone mode
    if (checkIOS && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => {
        setShowIOSBanner(true);
        trackAnalytics('ios_banner_shown');
      }, 2000);
    }

    // Handle install prompt for Android/Desktop
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      trackAnalytics('prompt_available');
      
      // Show buttons in header (only show appropriate one based on screen size)
      const mobileBtn = document.getElementById('install-app-header');
      const desktopBtn = document.getElementById('install-app-header-desktop');
      
      // Check screen size
      const isMobile = window.innerWidth < 768; // md breakpoint
      
      if (mobileBtn) {
        mobileBtn.style.display = isMobile ? 'flex' : 'none';
        mobileBtn.onclick = () => {
          setShowInstallPrompt(true);
          trackAnalytics('prompt_shown');
        };
      }
      if (desktopBtn) {
        desktopBtn.style.display = !isMobile ? 'flex' : 'none';
        desktopBtn.onclick = () => {
          setShowInstallPrompt(true);
          trackAnalytics('prompt_shown');
        };
      }
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      trackAnalytics('install');
    } else {
      trackAnalytics('dismiss');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* iOS Banner */}
      <AnimatePresence>
        {isIOS && showIOSBanner && (
          <>
            {/* Spacer to push content down */}
            <div className="h-[76px]"></div>
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 shadow-lg"
            >
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold">📲 Install My Calorie Needs</p>
                  <p className="text-sm opacity-90">
                    Tap the share button below ↓ then "Add to Home Screen"
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowIOSBanner(false);
                    trackAnalytics('ios_banner_dismissed');
                  }}
                  className="text-white hover:text-white/80 p-2 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Android/Desktop Floating Button */}
      {deferredPrompt && (
        <button
          onClick={() => {
            setShowInstallPrompt(true);
            trackAnalytics('prompt_shown');
          }}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Download className="w-6 h-6" />
        </button>
      )}

      {/* Install Modal */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <Smartphone className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Install My Calorie Needs</h3>
                <p className="text-gray-600 mb-6">
                  Add to your home screen for quick access and offline use!
                </p>
                <button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-semibold mb-3"
                >
                  Install Now
                </button>
                <button
                  onClick={() => {
                    setShowInstallPrompt(false);
                    trackAnalytics('prompt_dismissed');
                  }}
                  className="text-gray-500"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}