import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Brain,
  User,
  LogOut,
  Eye,
  NotebookText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { api } from './api/supabaseClient';

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Trade Planner",
    url: "/watchlist",
    icon: NotebookText,
  },
  {
    title: "Trade Log",
    url: "/tradelog",
    icon: BookOpen,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
  },
  {
    title: "AI Insights",
    url: "/ai-insights",
    icon: Brain,
  },
];

// Internal component to handle conditional rendering logic safely
const ReopenTrigger = () => {
  const { state } = useSidebar();
  const triggerStyle = "hover:bg-white/10 p-2 rounded-lg transition-all text-[#A0AEC0] hover:text-white";

  return (
    <div
      className={`hidden md:flex mb-4 transition-all duration-300 ease-in-out ${state === "collapsed"
          ? "opacity-100 h-auto translate-x-0"
          : "opacity-0 h-0 -translate-x-4 overflow-hidden pointer-events-none"
        }`}
    >
      <SidebarTrigger className={triggerStyle} />
    </div>
  );
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await api.auth.me();
        if (!currentUser) {
          navigate('/login');
        } else {
          setUser(currentUser);
        }

      } catch (error) {
        console.error("Auth check failed", error);
        navigate('/login'); // Redirect on error
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await api.auth.signOut();
    navigate('/login');
  };

  const triggerStyle = "hover:bg-white/10 p-2 rounded-lg transition-all text-[#A0AEC0] hover:text-white";

  return (
    <SidebarProvider
      defaultOpen={true}
      // FIX 1: App container is locked to screen height
      className="h-screen w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F123B 0%, #1a1f4d 50%, #0F123B 100%)' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        :root {
          --vision-navy: #0F123B;
          --vision-blue: #0075FF;
          --vision-cyan: #00C9FF;
          --vision-glass: rgba(17, 25, 40, 0.75);
          --vision-glass-border: rgba(255, 255, 255, 0.125);
          --vision-text-primary: #FFFFFF;
          --vision-text-secondary: #A0AEC0;
        }
        
        * {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        body {
          /* FIX 2: Global body lock prevents any background scrolling */
          margin: 0;
          padding: 0;
          overflow: hidden; 
          background: linear-gradient(135deg, #0F123B 0%, #1a1f4d 50%, #0F123B 100%);
        }

        .glass-card {
          background: var(--vision-glass);
          backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid var(--vision-glass-border);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        
        .glass-hover {
          transition: all 0.3s ease-in-out;
        }
        
        .glass-hover:hover {
          background: rgba(17, 25, 40, 0.85);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 117, 255, 0.2);
        }

        [data-sidebar="sidebar"] {
          background: var(--vision-glass) !important;
          backdrop-filter: blur(12px) saturate(180%) !important;
          border-right: 1px solid var(--vision-glass-border) !important;
        }
        
        [data-state="collapsed"] [data-sidebar="sidebar"] {
          border-right: 0 !important;
        }

        /* Custom Scrollbar for the main content area only */
        .content-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .content-scroll::-webkit-scrollbar-track {
          background: rgba(17, 25, 40, 0.5);
        }
        .content-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 117, 255, 0.5);
          border-radius: 4px;
        }
        .content-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 117, 255, 0.7);
        }
      `}</style>

      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="border-b border-white/10 p-6 transition-all group-data-[state=collapsed]:p-0 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:h-0 group-data-[state=collapsed]:overflow-hidden">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', boxShadow: '0 8px 24px rgba(0, 117, 255, 0.4)' }}>
                <TrendingUp className="w-7 h-7 text-white font-bold" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-xl text-white tracking-tight whitespace-nowrap">TradeMind</h2>
                <p className="text-xs text-[#A0AEC0] whitespace-nowrap">AI Trading Journal</p>
              </div>
            </div>
            <SidebarTrigger className={triggerStyle} />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-3 mt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`mb-2 transition-all duration-200 rounded-xl group ${isActive
                            ? "bg-gradient-to-r from-blue-600/10 to-cyan-500/10"
                            : "hover:bg-white/5"
                          }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3 w-full">
                          <item.icon
                            className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? "text-[#00C9FF]" : "text-[#A0AEC0] group-hover:text-white"
                              }`}
                            strokeWidth={2}
                          />
                          <span
                            className={`font-medium whitespace-nowrap transition-colors ${isActive ? "text-[#00C9FF]" : "text-[#A0AEC0] group-hover:text-white"
                              }`}
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-4 mt-auto group-data-[state=collapsed]:hidden">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl glass-card glass-hover min-w-0">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 201, 255, 0.2) 100%)', border: '1px solid rgba(0, 117, 255, 0.3)' }}>
                <User className="w-5 h-5 text-[#0075FF]" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="font-semibold text-sm text-white truncate">
                  {user?.full_name || 'Developer'}
                </p>
                <p className="text-xs text-[#A0AEC0] truncate">Trader</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-[#A0AEC0] hover:text-white" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* FIX 3: Content Area - The only place that scrolls */}
      <SidebarInset
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 h-full overflow-hidden"
        style={{ background: 'transparent' }}
      >
        <div className="flex-1 overflow-y-auto content-scroll p-8 w-full h-full">
          <ReopenTrigger />

          <div className="md:hidden mb-4">
            <SidebarTrigger />
          </div>

          <Outlet />
        </div>
      </SidebarInset>

    </SidebarProvider>
  );
}