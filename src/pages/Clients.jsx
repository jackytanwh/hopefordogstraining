
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search,
  Plus,
  Phone,
  Calendar,
  PawPrint,
  Filter,
  Eye,
  GraduationCap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isPast, startOfDay } from "date-fns";

const statusColors = {
  initial: "bg-blue-100 text-blue-800 border-blue-200",
  follow_up: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
  paused: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function Clients() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlProgramFilter = urlParams.get('program');

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState(urlProgramFilter || "all");
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const data = await base44.entities.Client.list();
      const sortedData = data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const filteredData = urlProgramFilter ?
        sortedData.filter((client) => client.program === urlProgramFilter) :
        sortedData;
      setClients(filteredData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  }, [urlProgramFilter]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Get next upcoming consultation date for a client
  const getNextConsultationDate = (client) => {
    const today = startOfDay(new Date());
    const dates = [];

    // Check consultation dates
    if (client.initial_consultation_date) {
      try {
        const date = parseISO(client.initial_consultation_date);
        if (date >= today) dates.push({ date, type: 'Initial' });
      } catch (e) {}
    }
    
    if (client.follow_up_date) {
      try {
        const date = parseISO(client.follow_up_date);
        if (date >= today) dates.push({ date, type: 'Follow-up' });
      } catch (e) {}
    }
    
    if (client.second_consultation_date) {
      try {
        const date = parseISO(client.second_consultation_date);
        if (date >= today) dates.push({ date, type: 'Second' });
      } catch (e) {}
    }

    // Check Kinder Puppy weekly dates
    if (client.program === 'kinder_puppy' && client.kinder_puppy_progress) {
      ['week1', 'week2', 'week3', 'week4'].forEach((weekKey, index) => {
        const weekDate = client.kinder_puppy_progress[weekKey]?.week_date;
        if (weekDate) {
          try {
            const date = parseISO(weekDate);
            if (date >= today) dates.push({ date, type: `Week ${index + 1}` });
          } catch (e) {}
        }
      });
    }

    // Check Basic Manners In-Home weekly dates
    if (client.program === 'basic_manners' && client.basic_manners_progress) {
      ['week1', 'week2', 'week3', 'week4', 'week5', 'week6'].forEach((weekKey, index) => {
        const weekDate = client.basic_manners_progress[weekKey]?.week_date;
        if (weekDate) {
          try {
            const date = parseISO(weekDate);
            if (date >= today) dates.push({ date, type: `Week ${index + 1}` });
          } catch (e) {}
        }
      });
    }

    // Check Basic Manners FYOG weekly dates
    if (client.program === 'basic_manners_fyog' && client.basic_manners_fyog_progress) {
      ['week1', 'week2', 'week3', 'week4', 'week5', 'week6', 'week7'].forEach((weekKey, index) => {
        const weekDate = client.basic_manners_fyog_progress[weekKey]?.week_date;
        if (weekDate) {
          try {
            const date = parseISO(weekDate);
            if (date >= today) dates.push({ date, type: `Week ${index + 1}` });
          } catch (e) {}
        }
      });
    }

    if (dates.length === 0) return null;
    
    // Sort and return earliest
    dates.sort((a, b) => a.date.getTime() - b.date.getTime());
    return dates[0];
  };

  const filterClients = useCallback(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter((client) =>
        client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.dog_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.breed?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.training_status === statusFilter);
    }

    if (programFilter !== "all") {
      filtered = filtered.filter((client) => client.program === programFilter);
    }

    // Sort by next upcoming consultation date
    filtered.sort((a, b) => {
      const dateA = getNextConsultationDate(a);
      const dateB = getNextConsultationDate(b);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA.date.getTime() - dateB.date.getTime();
    });

    setFilteredClients(filtered);
  }, [clients, searchTerm, statusFilter, programFilter]);

  useEffect(() => {
    filterClients();
  }, [filterClients]);

  const getPageTitle = () => {
    if (urlProgramFilter === 'kinder_puppy') return 'Kinder Puppy Clients';
    if (urlProgramFilter === 'basic_manners') return 'Basic Manners In-Home Clients';
    if (urlProgramFilter === 'basic_manners_group') return 'Basic Manners Group Clients';
    if (urlProgramFilter === 'basic_manners_fyog') return 'Basic Manners FYOG Clients';
    if (urlProgramFilter === 'behavioural_modification') return 'Behavioural Modification Clients';
    return 'All Clients';
  };

  const getPageSubtitle = () => {
    if (urlProgramFilter === 'kinder_puppy') return 'Manage your Kinder Puppy clients and their progress.';
    if (urlProgramFilter === 'basic_manners') return 'Manage your Basic Manners In-Home clients and their progress.';
    if (urlProgramFilter === 'basic_manners_group') return 'Manage your Basic Manners Group clients and their progress.';
    if (urlProgramFilter === 'basic_manners_fyog') return 'Manage your Basic Manners FYOG clients and their progress.';
    if (urlProgramFilter === 'behavioural_modification') return 'Manage your Behavioural Modification clients and their progress.';
    return 'Manage your training clients and their progress.';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{getPageTitle()}</h1>
          <p className="text-slate-600">{getPageSubtitle()}</p>
        </div>
        <Link to={createPageUrl("AddClient")}>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by client name, puppy's name, or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="initial">Initial</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!urlProgramFilter && (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="kinder_puppy">Kinder Puppy</SelectItem>
                    <SelectItem value="basic_manners">Basic Manners In-Home</SelectItem>
                    <SelectItem value="basic_manners_group">Basic Manners Group</SelectItem>
                    <SelectItem value="basic_manners_fyog">Basic Manners FYOG</SelectItem>
                    <SelectItem value="behavioural_modification">Behavioural Modification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-slate-600 text-sm md:text-base">
          Showing {filteredClients.length} of {clients.length} clients
          {urlProgramFilter && ` in ${urlProgramFilter.replace(/_/g, ' ')} program`}
        </p>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ?
          Array(6).fill(0).map((_, i) =>
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) :
          filteredClients.length === 0 ?
            <div className="col-span-full text-center py-12">
              <PawPrint className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No clients found</h3>
              <p className="text-slate-500 mb-4 px-4">
                {searchTerm || statusFilter !== "all" || programFilter !== "all" ?
                  "Try adjusting your search or filter criteria." :
                  "Get started by adding your first client."
                }
              </p>
              <Link to={createPageUrl("AddClient")}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              </Link>
            </div> :

            filteredClients.map((client) => {
              const nextConsultation = getNextConsultationDate(client);
              
              return (
                <Card key={client.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col">
                  <CardHeader className="pb-3 px-4 md:px-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {client.client_name}
                        </CardTitle>
                        <p className="text-slate-600 flex items-center gap-1 mt-1">
                          <PawPrint className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{client.dog_name}</span>
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${statusColors[client.training_status]} border font-medium capitalize flex-shrink-0 text-xs`}>
                        {client.training_status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow flex flex-col px-4 md:px-6">
                    <div className="text-sm text-slate-600 space-y-1 flex-grow">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{client.mobile_number}</span>
                      </div>
                      {client.breed &&
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-12 inline-block flex-shrink-0">Breed:</span>
                          <span className="truncate">{client.breed}</span>
                        </div>
                      }
                      {client.program &&
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3 h-3 flex-shrink-0" />
                          <span className="font-medium w-12 inline-block flex-shrink-0">Program:</span>
                          <span className="mx-2 capitalize truncate">{client.program?.replace(/_/g, ' ')}</span>
                        </div>
                      }
                      {nextConsultation && (
                        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg mt-2">
                          <Calendar className="w-3 h-3 flex-shrink-0 text-blue-600" />
                          <div className="flex flex-col">
                            <span className="text-xs text-blue-600 font-medium">{nextConsultation.type}</span>
                            <span className="text-xs text-blue-700 font-semibold">
                              {format(nextConsultation.date, "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-auto border-t border-slate-100">
                      <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200">
                          <Eye className="w-3 h-3 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        }
      </div>
    </div>
  );
}
