import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  PawPrint, 
  Plus,
  Phone,
  Clock,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isToday, parseISO, addDays, subDays, startOfDay, isPast, isBefore, startOfToday } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

import StatsCard from "../components/dashboard/StatsCard";
import UpcomingConsultations from "../components/dashboard/UpcomingConsultations";
import RecentClients from "../components/dashboard/RecentClients";
import BasicMannersGroupSchedule from "../components/dashboard/BasicMannersGroupSchedule";
import BasicMannersGroupCurriculum from "../components/dashboard/BasicMannersGroupCurriculum";
import BasicMannersGroupFYOGCurriculum from "../components/dashboard/BasicMannersGroupFYOGCurriculum";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl("BookingSystem");
          return;
        }
        
        setUser(currentUser);
        setAuthChecked(true);
      } catch (error) {
        console.error("Authentication error:", error);
        window.location.href = createPageUrl("BookingSystem");
      }
    };
    
    checkAuth();
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const programFilter = urlParams.get('program');

  const programName = programFilter === 'basic_manners' ? 'Basic Manners In-Home' :
    programFilter === 'basic_manners_group' ? 'Basic Manners Group Program' :
    programFilter === 'basic_manners_fyog' ? 'Basic Manners FYOG Program' :
    programFilter === 'kinder_puppy' ? 'Kinder Puppy Program' :
    programFilter === 'behavioural_modification' ? 'Behavioural Modification Program' : 'All Programs';

  const loadClients = useCallback(async () => {
    try {
      const data = await base44.entities.Client.list();
      const sortedData = data.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      const filteredData = programFilter 
        ? sortedData.filter(client => client.program === programFilter)
        : sortedData;
      
      // Auto-update Behavioural Modification clients from "initial" to "follow_up"
      const today = startOfToday();
      for (const client of filteredData) {
        if (
          client.program === 'behavioural_modification' &&
          client.training_status === 'initial' &&
          client.initial_consultation_date
        ) {
          const consultationDate = parseISO(client.initial_consultation_date);
          // Update to follow_up if the initial consultation date has passed (before today)
          if (isBefore(consultationDate, today)) {
            await base44.entities.Client.update(client.id, {
              training_status: 'follow_up'
            });
          }
        }
        
        // Auto-update Behavioural Modification clients from "follow_up" to "in_progress"
        if (
          client.program === 'behavioural_modification' &&
          client.training_status === 'follow_up' &&
          client.follow_up_date
        ) {
          const followUpDate = parseISO(client.follow_up_date);
          // Update to in_progress if the follow-up date has passed (before today)
          if (isBefore(followUpDate, today)) {
            await base44.entities.Client.update(client.id, {
              training_status: 'in_progress'
            });
          }
        }
      }
      
      // Reload data after potential updates
      const updatedData = await base44.entities.Client.list();
      const updatedSortedData = updatedData.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      const updatedFilteredData = programFilter 
        ? updatedSortedData.filter(client => client.program === programFilter)
        : updatedSortedData;
      
      setClients(updatedFilteredData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  }, [programFilter]);

  const loadFeedbackStats = useCallback(async () => {
    try {
      const feedbacks = await base44.entities.BookingFeedback.list();
      
      if (feedbacks.length > 0) {
        const totalFeedbacks = feedbacks.length;
        const avgOverallRating = feedbacks.reduce((sum, f) => sum + (f.overall_rating || 0), 0) / totalFeedbacks;
        const avgEaseOfUse = feedbacks.reduce((sum, f) => sum + (f.ease_of_use || 0), 0) / totalFeedbacks;
        const recommendCount = feedbacks.filter(f => f.would_recommend).length;
        const recommendPercentage = (recommendCount / totalFeedbacks) * 100;
        
        setFeedbackStats({
          total: totalFeedbacks,
          avgOverallRating: avgOverallRating.toFixed(1),
          avgEaseOfUse: avgEaseOfUse.toFixed(1),
          recommendPercentage: recommendPercentage.toFixed(0)
        });
      }
    } catch (error) {
      console.error("Error loading feedback stats:", error);
    }
  }, []);

  useEffect(() => {
    loadClients();
    if (!programFilter) {
      loadFeedbackStats();
    }
  }, [loadClients, loadFeedbackStats, programFilter]);

  useEffect(() => {
    if (!loading && clients.length > 0) {
      const todayString = format(new Date(), 'yyyy-MM-dd');
      
      // Existing notification logic for follow-up dates
      const followUpClients = clients.filter(client => 
        client.follow_up_date && 
        isToday(parseISO(client.follow_up_date)) &&
        client.training_status !== 'in_progress'
      );

      // Specific notification for Behavioural Modification follow-ups
      const behaviouralModificationFollowUps = clients.filter(client =>
        client.program === 'behavioural_modification' &&
        client.follow_up_date &&
        isToday(parseISO(client.follow_up_date))
      );
      
      followUpClients.forEach(client => {
        const notificationKey = `notification_shown_${client.id}_${todayString}`;
        
        if (!localStorage.getItem(notificationKey)) {
          toast({
            title: "🔔 Follow-up Reminder",
            description: `Today is the follow-up date for ${client.client_name} and ${client.dog_name}.`,
            action: (
              <ToastAction asChild altText="View Profile">
                <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                  View Profile
                </Link>
              </ToastAction>
            ),
          });
          localStorage.setItem(notificationKey, 'true');
        }
      });

      behaviouralModificationFollowUps.forEach(client => {
        const behaviouralNotificationKey = `behavioural_notification_${client.id}_${todayString}`;
        
        if (!localStorage.getItem(behaviouralNotificationKey)) {
          toast({
            title: "🎯 Behavioural Modification Follow-up",
            description: `Follow-up consultation scheduled today for ${client.client_name} and ${client.dog_name}. Review progress and adjust training plan as needed.`,
            action: (
              <ToastAction asChild altText="View Client">
                <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                  View Client
                </Link>
              </ToastAction>
            ),
            variant: "default",
          });
          localStorage.setItem(behaviouralNotificationKey, 'true');
        }
      });
    }
  }, [clients, loading, toast]);

  const getUpcomingConsultations = () => {
    // Modified to show consultations from today onwards (hides dates older than today)
    const today = startOfDay(new Date()); 
    const nextWeek = addDays(new Date(), 7);
    
    const upcoming = [];
    
    clients.forEach(client => {
      // Existing consultation dates
      if (client.initial_consultation_date) {
        try {
          const date = parseISO(client.initial_consultation_date);
          if (date >= today && date <= nextWeek) { // Updated comparison
            upcoming.push({
              id: client.id,
              client_name: client.client_name,
              dog_name: client.dog_name,
              mobile_number: client.mobile_number,
              training_status: client.training_status,
              program: client.program,
              consultation_type: 'Initial',
              date: client.initial_consultation_date
            });
          }
        } catch (error) {
          console.error('Error parsing initial consultation date for client:', client.id, error);
        }
      }
      
      if (client.follow_up_date) {
        try {
          const date = parseISO(client.follow_up_date);
          if (date >= today && date <= nextWeek) { // Updated comparison
            upcoming.push({
              id: client.id,
              client_name: client.client_name,
              dog_name: client.dog_name,
              mobile_number: client.mobile_number,
              training_status: client.training_status,
              program: client.program,
              consultation_type: 'Follow-up',
              date: client.follow_up_date
            });
          }
        } catch (error) {
          console.error('Error parsing follow-up date for client:', client.id, error);
        }
      }
      
      if (client.second_consultation_date) {
        try {
          const date = parseISO(client.second_consultation_date);
          if (date >= today && date <= nextWeek) { // Updated comparison
            upcoming.push({
              id: client.id,
              client_name: client.client_name,
              dog_name: client.dog_name,
              mobile_number: client.mobile_number,
              training_status: client.training_status,
              program: client.program,
              consultation_type: 'Second',
              date: client.second_consultation_date
            });
          }
        } catch (error) {
          console.error('Error parsing second consultation date for client:', client.id, error);
        }
      }

      // Add Kinder Puppy weekly dates
      if (client.program === 'kinder_puppy' && client.kinder_puppy_progress) {
        ['week1', 'week2', 'week3', 'week4'].forEach((weekKey, index) => {
          const weekDate = client.kinder_puppy_progress[weekKey]?.week_date;
          if (weekDate) {
            try {
              const date = parseISO(weekDate);
              if (date >= today && date <= nextWeek) { // Updated comparison
                upcoming.push({
                  id: client.id,
                  client_name: client.client_name,
                  dog_name: client.dog_name,
                  mobile_number: client.mobile_number,
                  training_status: client.training_status,
                  program: client.program,
                  consultation_type: `Kinder Puppy - Week ${index + 1}`, // More descriptive type
                  date: weekDate
                });
              }
            } catch (error) {
              console.error('Error parsing Kinder Puppy week date for client:', client.id, error);
            }
          }
        });
      }

      // Add Basic Manners In-Home weekly dates
      if (client.program === 'basic_manners' && client.basic_manners_progress) {
        ['week1', 'week2', 'week3', 'week4', 'week5', 'week6'].forEach((weekKey, index) => {
          const weekDate = client.basic_manners_progress[weekKey]?.week_date;
          if (weekDate) {
            try {
              const date = parseISO(weekDate);
              if (date >= today && date <= nextWeek) { // Updated comparison
                upcoming.push({
                  id: client.id,
                  client_name: client.client_name,
                  dog_name: client.dog_name,
                  mobile_number: client.mobile_number,
                  training_status: client.training_status,
                  program: client.program,
                  consultation_type: `Basic Manners - Week ${index + 1}`, // More descriptive type
                  date: weekDate
                });
              }
            } catch (error) {
              console.error('Error parsing Basic Manners week date for client:', client.id, error);
            }
          }
        });
      }
    });
    
    // Sort by date - earliest first
    return upcoming.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error('Error comparing dates in upcoming consultations:', error);
        return a.date.localeCompare(b.date);
      }
    });
  };

  const getClientsByStatus = (status) => {
    return clients.filter(client => client.training_status === status).length;
  };

  const getPageTitle = () => {
    if (programFilter === 'kinder_puppy') return 'Kinder Puppy Dashboard';
    if (programFilter === 'basic_manners') return 'Basic Manners In-Home Dashboard';
    if (programFilter === 'basic_manners_group') return 'Basic Manners Group Dashboard';
    if (programFilter === 'basic_manners_fyog') return 'Basic Manners FYOG Dashboard';
    if (programFilter === 'behavioural_modification') return 'Behavioural Modification Dashboard';
    return 'Welcome Back!';
  };

  const getPageSubtitle = () => {
    if (programFilter === 'kinder_puppy') return "Here's what's happening with your Kinder Puppy clients today.";
    if (programFilter === 'basic_manners') return "Here's what's happening with your Basic Manners In-Home clients today.";
    if (programFilter === 'basic_manners_group') return "Manage your 7-week group training program.";
    if (programFilter === 'basic_manners_fyog') return "Manage your Basic Manners FYOG program.";
    if (programFilter === 'behavioural_modification') return "Here's what's happening with your Behavioural Modification clients today.";
    return "Here's what's happening with your training clients today.";
  };

  const renderProgramContent = () => {
    if (programFilter === 'basic_manners_group') {
      const groupClients = clients.filter(c => c.program === 'basic_manners_group');
      
      return (
        <div className="space-y-6">
          {/* Client Cards with Enhanced Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupClients.map((client) => (
              <Card key={client.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <PawPrint className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {client.training_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{client.dog_name}</h3>
                  <p className="text-sm text-slate-600 mb-3">{client.client_name}</p>
                  
                  {/* Enhanced Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                    {client.dog_age && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Age:</span>
                        <span>{client.dog_age}</span>
                      </div>
                    )}
                    {client.breed && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Breed:</span>
                        <span className="truncate">{client.breed}</span>
                      </div>
                    )}
                    {client.diet && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Diet:</span>
                        <span className="truncate">{client.diet}</span>
                      </div>
                    )}
                    {client.food_allergy !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Food Allergy:</span>
                        <span>{client.food_allergy ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {client.sleep_area && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Sleep Area:</span>
                        <span className="truncate">{client.sleep_area}</span>
                      </div>
                    )}
                  </div>
                  
                  <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <BasicMannersGroupSchedule clients={clients} onUpdate={loadClients} programName="Basic Manners Group" />
          <BasicMannersGroupCurriculum clients={clients} onUpdate={loadClients} programName="Basic Manners Group" />
        </div>
      );
    }

    if (programFilter === 'basic_manners_fyog') {
      const fyogClients = clients.filter(c => c.program === 'basic_manners_fyog');
      
      // Group clients by fyog_group
      const groupedClients = fyogClients.reduce((acc, client) => {
        const group = client.fyog_group || 'Ungrouped';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(client);
        return acc;
      }, {});
      
      return (
        <div className="space-y-6">
          {Object.entries(groupedClients).map(([groupName, groupClients]) => {
            const activeClients = groupClients.length;
            const maxClients = 4;
            
            return (
              <div key={groupName} className="space-y-4">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Basic Manners FYOG - {groupName}</span>
                      <Badge variant={activeClients >= maxClients ? "destructive" : "secondary"}>
                        {activeClients}/{maxClients} Dogs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeClients >= maxClients && (
                      <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-4">
                        <p className="font-semibold">⚠️ Class is at maximum capacity</p>
                        <p className="text-sm mt-1">This FYOG class can accommodate a maximum of 4 dogs.</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {groupClients.map(client => (
                        <div key={client.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">{client.dog_name}</p>
                            <p className="text-sm text-slate-600">{client.client_name}</p>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                              {client.dog_age && (
                                <span className="bg-slate-100 px-2 py-1 rounded">Age: {client.dog_age}</span>
                              )}
                              {client.breed && (
                                <span className="bg-slate-100 px-2 py-1 rounded">Breed: {client.breed}</span>
                              )}
                              {client.gender && (
                                <span className="bg-slate-100 px-2 py-1 rounded capitalize">Gender: {client.gender}</span>
                              )}
                              {client.food_allergy !== undefined && (
                                <span className={`px-2 py-1 rounded ${client.food_allergy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  Food Allergy: {client.food_allergy ? 'Yes' : 'No'}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <BasicMannersGroupFYOGCurriculum clients={groupClients} onUpdate={loadClients} programName={`Basic Manners FYOG - ${groupName}`} />
              </div>
            );
          })}
        </div>
      );
    }

    // Default content for all other programs or no programFilter
    return (
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <UpcomingConsultations 
            consultations={getUpcomingConsultations()} 
            loading={loading}
          />
          
          {/* Booking Feedback Stats - Only show on main dashboard */}
          {!programFilter && feedbackStats && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="border-b border-purple-100">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Booking Experience Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{feedbackStats.total}</div>
                    <div className="text-xs text-slate-600 mt-1">Total Responses</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                      {feedbackStats.avgOverallRating}
                      <span className="text-lg">⭐</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Avg. Rating</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                      {feedbackStats.avgEaseOfUse}
                      <span className="text-lg">👍</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Ease of Use</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{feedbackStats.recommendPercentage}%</div>
                    <div className="text-xs text-slate-600 mt-1">Would Recommend</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div>
          <RecentClients 
            clients={clients.slice(0, 5)} 
            loading={loading}
          />
        </div>
      </div>
    );
  };

  if (!authChecked || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{getPageTitle()}</h1>
          <p className="text-slate-600">{getPageSubtitle()}</p>
        </div>
        <Link to={createPageUrl("AddClient")}>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-5 h-5 mr-2" />
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Hide for Basic Manners Group and FYOG */}
      {programFilter !== 'basic_manners_group' && programFilter !== 'basic_manners_fyog' && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Total Clients"
            value={clients.length}
            icon={Users}
            gradient="from-blue-500 to-blue-600"
            trend={programFilter ? `${programFilter.replace(/_/g, ' ')} clients` : "Active training programs"}
          />
          <StatsCard
            title="In Progress"
            value={getClientsByStatus('in_progress')}
            icon={TrendingUp}
            gradient="from-green-500 to-green-600"
            trend="Currently training"
          />
          <StatsCard
            title="This Week"
            value={getUpcomingConsultations().length}
            icon={Calendar}
            gradient="from-purple-500 to-purple-600"
            trend="Upcoming consultations"
          />
          <StatsCard
            title="Completed"
            value={getClientsByStatus('completed')}
            icon={PawPrint}
            gradient="from-orange-500 to-orange-600"
            trend="Success stories"
          />
        </div>
      )}

      {/* Main Content (dynamic based on programFilter) */}
      {renderProgramContent()}
    </div>
  );
}