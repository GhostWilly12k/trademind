import React, { useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react"; 
import { createClerkSupabaseClient } from "./api/supabaseClient"; // Check this path!
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  Brain,
  NotebookText,
  Loader2 
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
import LandingPage from "./pages/LandingPage"; 

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trade Planner", url: "/watchlist", icon: NotebookText },
  { title: "Trade Log", url: "/tradelog", icon: BookOpen },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "AI Insights", url: "/ai-insights", icon: Brain },
];

// Helper for reopening sidebar
const ReopenTrigger = () => {
  const { state } = useSidebar();
  const triggerStyle = "hover:bg-white/10 p-2 rounded-lg transition-all text-[#A0AEC0] hover:text-white";

  return (
    <div className={`hidden md:flex mb-4 transition-all duration-300 ease-in-out ${
      state === "collapsed" 
        ? "opacity-100 h-auto translate-x-0" 
        : "opacity-0 h-0 -translate-x-4 overflow-hidden pointer-events-none"
    }`}>
      <SidebarTrigger className={triggerStyle} />
    </div>
  );
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Clerk Hooks
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  // 2. AUTOMATIC PROFILE SYNC (Option B)
  useEffect(() => {
    const syncUserToSupabase = async () => {
      // Only run if user is fully loaded and signed in
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        
        // Create authenticated client
        const client = await createClerkSupabaseClient(getToken);
        
        // A. Check if profile exists
        const { data: existingProfile, error: fetchError } = await client
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // B. If not found, create it
        if (!existingProfile && (!fetchError || fetchError.code === 'PGRST116')) {
          console.log("Creating new profile for user:", user.id);
          
          const { error: insertError } = await client
            .from('profiles')
            .insert([
              {
                id: user.id, // The Clerk ID (Text)
                email: user.primaryEmailAddress?.emailAddress,
                username: user.fullName || user.username || 'Trader',
                // xp_points and badges will use DB defaults
              }
            ]);

          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            console.log("Profile created successfully");
          }
        }
      } catch (err) {
        console.error("Profile sync failed:", err);
      }
    };

    syncUserToSupabase();
  }, [isLoaded, isSignedIn, user, getToken]);

  const triggerStyle = "hover:bg-white/10 p-2 rounded-lg transition-all text-[#A0AEC0] hover:text-white";

  // 3. Loading State
  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-[#0F123B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // 4. Unauthenticated State -> Landing Page
  if (!isSignedIn) {
    return <LandingPage />;
  }

  // 5. Authenticated State -> Dashboard Layout
  return (
    <SidebarProvider 
      defaultOpen={true} 
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
                        className={`mb-2 transition-all duration-200 rounded-xl group ${
                          isActive 
                            ? "bg-gradient-to-r from-blue-600/10 to-cyan-500/10" 
                            : "hover:bg-white/5"
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3 w-full">
                          <item.icon 
                            className={`w-5 h-5 flex-shrink-0 transition-colors ${
                              isActive ? "text-[#00C9FF]" : "text-[#A0AEC0] group-hover:text-white"
                            }`} 
                            strokeWidth={2} 
                          />
                          <span 
                            className={`font-medium whitespace-nowrap transition-colors ${
                              isActive ? "text-[#00C9FF]" : "text-[#A0AEC0] group-hover:text-white"
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
          <div className="flex items-center gap-3 px-2">
            <UserButton 
                afterSignOutUrl="/"
                appearance={{
                    elements: {
                        userButtonAvatarBox: "w-10 h-10 border-2 border-white/10 hover:border-cyan-400 transition-colors",
                        userButtonPopoverCard: "bg-slate-900 border border-slate-800",
                        userButtonPopoverActionButton: "hover:bg-slate-800 text-slate-200"
                    }
                }}
            />
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate">
                    {user?.fullName || user?.username || "Trader"}
                </span>
                <span className="text-xs text-slate-400 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

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