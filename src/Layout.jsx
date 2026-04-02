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
  Tag,
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
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

function InnerLayout({ children, currentPageName }) {
  const { setOpenMobile } = useSidebar();
  const closeMenu = () => setOpenMobile(false);

  const urlParams = new URLSearchParams(window.location.search);
  const program = urlParams.get('program');

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

  useEffect(() => {
    if (program === 'kinder_puppy') setIsKinderPuppyOpen(true);
    if (program === 'basic_manners') setIsBasicMannersOpen(true);
    if (program === 'basic_manners_group') setIsBasicMannersGroupOpen(true);
    if (program === 'basic_manners_fyog') setIsBasicMannersFYOGOpen(true);
    if (program === 'behavioural_modification') setIsBehaviouralModificationOpen(true);
  }, [program]);

  return (
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
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
            Booking System
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={currentPageName === "BookingSystem"}>
              <Link to={createPageUrl("BookingSystem")} onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5">
                <Calendar className="w-4 h-4" />
                <span className="text-base font-medium">Client Booking Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={currentPageName === "AdminBookings"}>
              <Link to={createPageUrl("AdminBookings")} onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5">
                <AlignJustify className="w-4 h-4" />
                <span className="text-base font-medium">Manage Bookings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={currentPageName === "BookingCalendar"}>
              <Link to={createPageUrl("BookingCalendar")} onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5">
                <Calendar className="w-4 h-4" />
                <span className="text-base font-medium">Booking Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={currentPageName === "GroupClassScheduleSettings"}>
              <Link to={createPageUrl("GroupClassScheduleSettings")} onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5">
                <Clock className="w-4 h-4" />
                <span className="text-base font-medium">Group Class Schedule</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={currentPageName === "PromoCodes"}>
              <Link to="/PromoCodes" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5">
                <Tag className="w-4 h-4" />
                <span className="text-base font-medium">Promo Codes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
  );
}

export default function Layout({ children, currentPageName }) {
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicBookingPage = ['BookingSystem', 'BookService', 'BookingConfirmation', 'PaymentSuccess'].includes(currentPageName);

  if (isPublicBookingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
        <main>{children}</main>
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <InnerLayout currentPageName={currentPageName}>
        {children}
      </InnerLayout>
    </SidebarProvider>
  );
}