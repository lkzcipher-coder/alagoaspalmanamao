import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import UserLayout from '@/components/layout/UserLayout';
import Home from '@/components/turista/Home';
import Reels from '@/components/turista/Reels';
import MapView from '@/components/turista/MapView';
import Coupons from '@/components/turista/Coupons';
import Profile from '@/components/turista/Profile';
import Favorites from '@/components/turista/Favorites';
import { Loader2 } from 'lucide-react';
import TideTable from '@/components/turista/TideTable';
import Nightlife from '@/components/turista/Nightlife';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { setIsPremiumUser } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [couponInitialCategory, setCouponInitialCategory] = useState<string>('Todos');

  const { user, isLoading } = auth || { user: null, isLoading: true };

  // Handle hardware back button for tabs
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (activeTab !== 'home') {
        setActiveTab('home');
        // Prevent default browser back behavior by pushing state back if we want to stay in the app
        // But actually, just letting it go back to the previous entry is fine if that entry is 'home'
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Sync state with history when tab changes
  const handleTabChange = (newTab: string, category: string = 'Todos') => {
    if (newTab !== activeTab) {
      // Always push state when moving away from home to intercept back button
      if (newTab !== 'home' && activeTab === 'home') {
        window.history.pushState({ tab: newTab }, '');
      }
      setActiveTab(newTab);
    }
    
    if (newTab === 'coupons') {
      setCouponInitialCategory(category);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // BYPASS: Se estivermos em um fluxo de recuperação de senha, não redirecione para /welcome
        if (window.location.pathname.includes('update-password') || window.location.hash.includes('type=recovery')) {
          console.log("[Index] Recovery flow detected in path or hash, bypassing /welcome redirect");
          return;
        }
        console.log("[Index] No user, redirecting to /welcome");
        navigate({ to: '/welcome' });
      } else {
        console.log("[Index] User state:", { email: user.email, role: user.role });
        if (user.role === 'admin') {
          console.log("[Index] Admin detected, REDIRECTING to /admin");
          navigate({ to: '/admin' });
        } else {
          console.log("[Index] Regular user detected, staying on home");
        }
      }
    } else {
      console.log("[Index] Auth is loading...");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success("Pagamento realizado com sucesso! Ativando seu VIP...");
      setIsPremiumUser(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failure') {
      toast.error("O pagamento não pôde ser concluído. Tente novamente.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'pending') {
      toast.info("Seu pagamento está em processamento. O VIP será ativado assim que confirmado.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setIsPremiumUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm animate-pulse">Carregando Alagoas...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <Home 
        onNavigateToCoupons={(cat) => handleTabChange('coupons', cat)} 
        onNavigateToNightlife={() => handleTabChange('nightlife')}
        onNavigateToReels={() => handleTabChange('reels')}
      />;
      case 'reels': return <Reels onClose={() => handleTabChange('home')} />;
      case 'map': return <MapView />;
      case 'tide': return <TideTable />;
      case 'nightlife': return <Nightlife />;
      case 'coupons': return <Coupons initialCategory="VIP" />;
      case 'favorites': return <Favorites />;
      case 'profile': return <Profile setActiveTab={handleTabChange} />;
      default: return <Home />;
    }
  };

  return (
    <UserLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderTab()}
    </UserLayout>
  );
}
