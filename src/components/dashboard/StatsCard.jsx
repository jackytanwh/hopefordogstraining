import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, gradient, trend }) {
  return (
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
      <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 bg-gradient-to-r ${gradient} rounded-full opacity-10`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} shadow-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 mb-1">
          {value}
        </div>
        {trend && (
          <div className="flex items-center text-sm text-slate-500">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}