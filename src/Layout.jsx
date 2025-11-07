
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Users,
  UserPlus,
  PawPrint,
  AlignJustify,
  ChevronDown,
  FolderHeart,
  GraduationCap,
  HeartPulse,
  Calendar,
  Clock
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

const kinderPuppyItems = [
  {
    title: "Dashboard",
    pageName: "Dashboard",
    url: createPageUrl("Dashboard?program=kinder_puppy"),
    icon: Home
  },
  {
    title: "All Clients",
    pageName: "Clients",
    url: createPageUrl("Clients?program=kinder_puppy"),
    icon: Users
  }
];

const basicMannersItems = [
  {
    title: "Dashboard",
    pageName: "Dashboard",
    url: createPageUrl("Dashboard?program=basic_manners"),
    icon: Home
  },
  {
    title: "All Clients",
    pageName: "Clients",
    url: createPageUrl("Clients?program=basic_manners"),
    icon: Users
  }
];

const basicMannersGroupItems = [
  {
    title: "Dashboard",
    pageName: "Dashboard",
    url: createPageUrl("Dashboard?program=basic_manners_group"),
    icon: Home
  }
];

const basicMannersFYOGItems = [
  {
    title: "Dashboard",
    pageName: "Dashboard",
    url: createPageUrl("Dashboard?program=basic_manners_fyog"),
    icon: Home
  },
  {
    title: "All Clients",
    pageName: "Clients",
    url: createPageUrl("Clients?program=basic_manners_fyog"),
    icon: Users
  }
];

const behaviouralModificationItems = [
  {
    title: "Dashboard",
    pageName: "Dashboard",
    url: createPageUrl("Dashboard?program=behavioural_modification"),
    icon: Home
  },
  {
    title: "All Clients",
    pageName: "Clients",
    url: createPageUrl("Clients?program=behavioural_modification"),
    icon: Users
  }
];

export default function Layout({ children, currentPageName }) {
  // Use window.location instead of useLocation() to avoid router context issues
  const urlParams = new URLSearchParams(window.location.search);
  const program = urlParams.get('program');

  // Load initial state from localStorage or URL - ALWAYS call hooks before any conditional returns
  const [isKinderPuppyOpen, setIsKinderPuppyOpen] = useState(() => {
    const saved = localStorage.getItem('kinderPuppyOpen');
    return saved !== null ? JSON.parse(saved) : program === 'kinder_puppy';
  });
  
  const [isBasicMannersOpen, setIsBasicMannersOpen] = useState(() => {
    const saved = localStorage.getItem('basicMannersOpen');
    return saved !== null ? JSON.parse(saved) : program === 'basic_manners';
  });
  
  const [isBasicMannersGroupOpen, setIsBasicMannersGroupOpen] = useState(() => {
    const saved = localStorage.getItem('basicMannersGroupOpen');
    return saved !== null ? JSON.parse(saved) : program === 'basic_manners_group';
  });

  const [isBasicMannersFYOGOpen, setIsBasicMannersFYOGOpen] = useState(() => {
    const saved = localStorage.getItem('basicMannersFYOGOpen');
    return saved !== null ? JSON.parse(saved) : program === 'basic_manners_fyog';
  });
  
  const [isBehaviouralModificationOpen, setIsBehaviouralModificationOpen] = useState(() => {
    const saved = localStorage.getItem('behaviouralModificationOpen');
    return saved !== null ? JSON.parse(saved) : program === 'behavioural_modification';
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kinderPuppyOpen', JSON.stringify(isKinderPuppyOpen));
  }, [isKinderPuppyOpen]);

  useEffect(() => {
    localStorage.setItem('basicMannersOpen', JSON.stringify(isBasicMannersOpen));
  }, [isBasicMannersOpen]);

  useEffect(() => {
    localStorage.setItem('basicMannersGroupOpen', JSON.stringify(isBasicMannersGroupOpen));
  }, [isBasicMannersGroupOpen]);

  useEffect(() => {
    localStorage.setItem('basicMannersFYOGOpen', JSON.stringify(isBasicMannersFYOGOpen));
  }, [isBasicMannersFYOGOpen]);

  useEffect(() => {
    localStorage.setItem('behaviouralModificationOpen', JSON.stringify(isBehaviouralModificationOpen));
  }, [isBehaviouralModificationOpen]);

  // Open relevant dropdown when program URL param changes
  useEffect(() => {
    if (program === 'kinder_puppy') setIsKinderPuppyOpen(true);
    if (program === 'basic_manners') setIsBasicMannersOpen(true);
    if (program === 'basic_manners_group') setIsBasicMannersGroupOpen(true);
    if (program === 'basic_manners_fyog') setIsBasicMannersFYOGOpen(true);
    if (program === 'behavioural_modification') setIsBehaviouralModificationOpen(true);
  }, [program]);

  // Check if current page is a public booking portal page - AFTER all hooks
  const isPublicBookingPage = ['BookingSystem', 'BookService', 'BookingConfirmation'].includes(currentPageName);

  // If it's a public booking page, render without sidebar
  if (isPublicBookingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Simple header for public pages */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href={createPageUrl("BookingSystem")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Hopefordogs</h2>
                <p className="text-xs text-slate-500 font-medium">Canine Training</p>
              </div>
            </a>
          </div>
        </div>
        
        {/* Page content */}
        <main>
          {children}
        </main>
        
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Hopefordogs</h2>
                <p className="text-xs text-slate-500 font-medium">Canine Training</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-3 py-4">
            {/* Navigation Label - non-collapsible header for the menu section */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              Navigation
            </div>

            {/* Add Client - Top Level menu item */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={currentPageName === "AddClient"}
              >
                <Link to={createPageUrl("AddClient")} className="flex items-center gap-3 px-4 py-2.5">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Client</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* All Clients - Top Level menu item */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={currentPageName === "Clients" && !program}
              >
                <Link to={createPageUrl("Clients")} className="flex items-center gap-3 px-4 py-2.5">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">All Clients</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Booking System Section */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 mt-4">
              Booking System
            </div>

            {/* Client Booking Portal */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={currentPageName === "BookingSystem"}
              >
                <Link to={createPageUrl("BookingSystem")} className="flex items-center gap-3 px-4 py-2.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Client Booking Portal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Admin Bookings */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={currentPageName === "AdminBookings"}
              >
                <Link to={createPageUrl("AdminBookings")} className="flex items-center gap-3 px-4 py-2.5">
                  <AlignJustify className="w-4 h-4" />
                  <span className="text-sm font-medium">Manage Bookings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Booking Calendar */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={currentPageName === "BookingCalendar"}
              >
                <Link to={createPageUrl("BookingCalendar")} className="flex items-center gap-3 px-4 py-2.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Booking Calendar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Group Class Schedule Settings */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={currentPageName === "GroupClassScheduleSettings"}
              >
                <Link to={createPageUrl("GroupClassScheduleSettings")} className="flex items-center gap-3 px-4 py-2.5">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Group Class Schedule</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Programs Section */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 mt-4">
              Training Programs
            </div>

            {/* Kinder Puppy Program */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-slate-50/50 rounded-lg transition-all" onClick={() => setIsKinderPuppyOpen(!isKinderPuppyOpen)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                    <FolderHeart className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Kinder Puppy Program</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isKinderPuppyOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
              {isKinderPuppyOpen && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {kinderPuppyItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.pageName && program === 'kinder_puppy'}>
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            {/* Basic Manners In-Home Program */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-slate-50/50 rounded-lg transition-all" onClick={() => setIsBasicMannersOpen(!isBasicMannersOpen)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Basic Manners In-Home</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBasicMannersOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
              {isBasicMannersOpen && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {basicMannersItems.map((item) => (
                      <SidebarMenuItem key={`basic-${item.title}`}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.pageName && program === 'basic_manners'}>
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            {/* Basic Manners Group Program */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-slate-50/50 rounded-lg transition-all" onClick={() => setIsBasicMannersGroupOpen(!isBasicMannersGroupOpen)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Basic Manners Group</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBasicMannersGroupOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
              {isBasicMannersGroupOpen && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {basicMannersGroupItems.map((item) => (
                      <SidebarMenuItem key={`basic-group-${item.title}`}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.pageName && program === 'basic_manners_group'}>
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            {/* Basic Manners FYOG Program */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-slate-50/50 rounded-lg transition-all" onClick={() => setIsBasicMannersFYOGOpen(!isBasicMannersFYOGOpen)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                    <FolderHeart className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Basic Manners FYOG</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBasicMannersFYOGOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
              {isBasicMannersFYOGOpen && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {basicMannersFYOGItems.map((item) => (
                      <SidebarMenuItem key={`basic-fyog-${item.title}`}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.pageName && program === 'basic_manners_fyog'}>
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            {/* Behavioural Modification Program */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-slate-50/50 rounded-lg transition-all" onClick={() => setIsBehaviouralModificationOpen(!isBehaviouralModificationOpen)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                    <HeartPulse className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Behavioural Modification</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBehaviouralModificationOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
              {isBehaviouralModificationOpen && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {behaviouralModificationItems.map((item) => (
                      <SidebarMenuItem key={`b-mod-${item.title}`}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.pageName && program === 'behavioural_modification'}>
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Training Expert</div>
                <div className="text-xs text-slate-500">Making tails wag</div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 md:hidden">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-7 w-7">
                <AlignJustify className="w-7 h-7" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <PawPrint className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-slate-900">Hopefordogs</span>
              </div>
            </div>
          </div>
          
          {children}
        </main>
        
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
