import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate, useRouterState } from "@tanstack/react-router";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import PremiumUpsellModal from "@/components/common/PremiumUpsellModal";
import InstallPrompt from "@/components/common/InstallPrompt";
import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Crown } from "lucide-react";

import appCss from "../styles.css?url";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <h1 className="text-4xl font-bold text-foreground">Oops! Algo deu errado.</h1>
          <p className="mt-4 text-muted-foreground">Ocorreu um erro inesperado no aplicativo.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Alagoas na Palma da Mão" },
      { name: "description", content: "Alagoas na Palma da Mão is a modern, mobile-first PWA for Alagoas tourism." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Alagoas na Palma da Mão" },
      { property: "og:description", content: "Alagoas na Palma da Mão is a modern, mobile-first PWA for Alagoas tourism." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Alagoas na Palma da Mão" },
      { name: "twitter:description", content: "Alagoas na Palma da Mão is a modern, mobile-first PWA for Alagoas tourism." },
      { property: "og:image", content: "https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/logo%20oficial.png" },
      { name: "twitter:image", content: "https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/logo%20oficial.png" },
      { name: "theme-color", content: "#004b8d" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "ALAGOAS NA PALMA DA MÃO" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/logo%20oficial.png",
      },
      {
        rel: "apple-touch-icon",
        href: "https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/logo%20oficial.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppInner />
      </Providers>
    </ErrorBoundary>
  );
}

function AppInner() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user } = useAuth();
  const noticeShown = useRef(false);

  useEffect(() => {
    if (user?.isPremium && user.premiumExpiryDate && !noticeShown.current) {
      const expiryDate = new Date(user.premiumExpiryDate);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays <= 3) {
        toast("Aviso de Renovação", {
          description: "Sua assinatura VIP vence em breve. Renove agora para não perder o acesso!",
          icon: <Crown className="w-5 h-5 text-amber-500" />,
          duration: 10000,
        });
        noticeShown.current = true;
      }
    }
  }, [user]);

  useEffect(() => {
    const hasInitialState = window.history.state?.app === 'alagoas';
    
    if (window.history.length === 1 && !hasInitialState) {
      window.history.pushState({ app: 'alagoas' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      // BYPASS: Do not intercept back button if we are on update-password
      if (currentPath.includes('update-password')) {
        return;
      }
      
      if (currentPath !== '/') {
        if (!event.state || event.state.app === 'alagoas') {
          console.log("[BackButton] Intercepted back from", currentPath, "redirecting to /");
          navigate({ to: '/' });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath, navigate]);

  return (
    <>
      <Outlet />
      <Toaster />
      <InstallPrompt />
      <PremiumUpsellModal />
    </>
  );
}
