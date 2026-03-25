import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, Save, Loader2 } from "lucide-react";

export default function GroupClassScheduleSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState(null);
  const [schedule, setSchedule] = useState({
    start_date: '',
    start_time: '10:00',
    day_of_week: 'Saturday',
    weeks: 7 // This indicates 7 *sessions*, not necessarily 7 consecutive weeks
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const settings = await base44.entities.Settings.filter({ setting_key: 'basic_manners_group_schedule' });
      
      if (settings && settings.length > 0) {
        const setting = settings[0];
        setSettingId(setting.id);
        setSchedule(setting.setting_value || {
          start_date: '',
          start_time: '10:00',
          day_of_week: 'Saturday',
          weeks: 7
        });
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schedule.start_date) {
      toast({
        title: "Validation Error",
        description: "Please select a start date",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const settingData = {
        setting_key: 'basic_manners_group_schedule',
        setting_name: 'Basic Manners Group Class Schedule',
        setting_value: schedule,
        description: 'Fixed schedule for Basic Manners Group Class program',
        last_updated: new Date().toISOString()
      };

      if (settingId) {
        await base44.entities.Settings.update(settingId, settingData);
      } else {
        const newSetting = await base44.entities.Settings.create(settingData);
        setSettingId(newSetting.id);
      }

      toast({
        title: "Success",
        description: "Schedule settings saved successfully",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save schedule settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSchedule({ ...schedule, [field]: value });
  };

  const generateSessionDates = () => {
    if (!schedule.start_date) return [];
    
    const sessions = [];
    const startDate = new Date(schedule.start_date);
    
    // schedule.weeks is 7 for 7 sessions
    for (let i = 0; i < schedule.weeks; i++) {
      const sessionDate = new Date(startDate);
      
      // Add the 1-week break after session 4 (i.e., after the 4th iteration, when i=3)
      if (i < 4) {
        // Sessions 1-4: weekly (weeks 0, 1, 2, 3 from startDate)
        sessionDate.setDate(startDate.getDate() + (i * 7));
      } else {
        // Sessions 5-7: add extra week for the break.
        // i.e., session 5 (i=4) happens at startDate + (4+1)*7 = startDate + 5 weeks
        // session 6 (i=5) happens at startDate + (5+1)*7 = startDate + 6 weeks
        // session 7 (i=6) happens at startDate + (6+1)*7 = startDate + 7 weeks
        sessionDate.setDate(startDate.getDate() + ((i + 1) * 7));
      }
      
      sessions.push({
        week: i + 1,
        date: sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        isBreakWeek: false
      });
      
      // Insert the break week indicator after session 4 (which is when i is 3)
      if (i === 3) {
        const breakWeekDate = new Date(startDate);
        // Break week occurs 4 weeks after the start date
        breakWeekDate.setDate(startDate.getDate() + (4 * 7));
        sessions.push({
          week: 'Break', // Use a distinct identifier for the week number
          date: breakWeekDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          isBreakWeek: true
        });
      }
    }
    
    return sessions;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Group Class Schedule Settings</h1>
        <p className="text-slate-600 mt-1">Configure the fixed schedule for Basic Manners Group Class program</p>
      </div>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
            <p className="font-semibold text-slate-900 mb-2">ℹ️ About this setting</p>
            <p className="text-slate-700">
              This schedule will be displayed to clients when they book the Basic Manners Group Class. 
              The program runs for 7 sessions with a 1-week break after session 4, starting from the date you specify below.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Program Start Date (Week 1) *</Label>
              <Input
                id="start_date"
                type="date"
                value={schedule.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-slate-500">Select the first session date</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Session Time *</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Clock className="w-4 h-4 text-slate-500" />
                <Input
                  id="start_time"
                  type="time"
                  value={schedule.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">All sessions will start at this time</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Input
                id="day_of_week"
                value={schedule.day_of_week}
                onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                className="max-w-xs"
                placeholder="e.g., Saturday"
              />
              <p className="text-xs text-slate-500">Display name for the day (e.g., Saturday, Sunday)</p>
            </div>
          </div>

          {schedule.start_date && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Preview: 7-Session Schedule (with 1-week break after Session 4)</h3>
              <div className="space-y-2">
                {generateSessionDates().map((session, index) => (
                  <div 
                    key={index} // Use index as key because session.week can be 'Break'
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      session.isBreakWeek 
                        ? 'bg-amber-50 border border-amber-200' 
                        : 'bg-slate-50'
                    }`}
                  >
                    {session.isBreakWeek ? (
                      <>
                        <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          ⏸
                        </div>
                        <div>
                          <p className="font-medium text-sm text-amber-800">Break Week</p>
                          <p className="text-xs text-amber-700">{session.date}</p>
                          <p className="text-xs text-amber-700">No session this week</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {session.week}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Session {session.week}</p>
                          <p className="text-xs text-slate-600">{session.date} at {schedule.start_time}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving || !schedule.start_date}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Schedule
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}