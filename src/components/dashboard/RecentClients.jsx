import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, PawPrint, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  initial: "bg-blue-100 text-blue-800 border-blue-200",
  follow_up: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
  paused: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function RecentClients({ clients, loading }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Users className="w-5 h-5" />
            Recent Clients
          </CardTitle>
          <Link to={createPageUrl("Clients")}>
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-20 md:w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-12 md:w-16"></div>
                  </div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-12 md:w-16"></div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 px-2 md:px-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
            <p className="text-slate-500 mb-4">Start by adding your first client.</p>
            <Link to={createPageUrl("AddClient")}>
              <Button>Add Client</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {clients.map((client) => (
              <div key={client.id} 
                   className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-slate-900 text-sm md:text-base truncate">{client.client_name}</h4>
                    <p className="text-xs md:text-sm text-slate-600 truncate">{client.dog_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant="secondary"
                    className={`${statusColors[client.training_status]} border text-xs`}
                  >
                    {client.training_status.replace(/_/g, ' ')}
                  </Badge>
                  
                  <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}