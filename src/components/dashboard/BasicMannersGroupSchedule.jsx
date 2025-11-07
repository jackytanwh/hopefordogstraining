
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { Client } from "@/entities/Client";

export default function BasicMannersGroupSchedule({ clients, onUpdate, programName = "Basic Manners Group" }) {
  const [dates, setDates] = useState({
    commencement_date: '',
    week2_date: '',
    week3_date: '',
    week4_date: '',
    week5_date: '',
    week6_date: '',
    week7_date: ''
  });
  const [saving, setSaving] = useState(false);

  // Filter clients based on the programName prop
  const programClients = clients.filter(c =>
    programName === "Basic Manners FYOG"
      ? c.program === 'basic_manners_fyog'
      : c.program === 'basic_manners_group'
  );

  // Load existing dates from the first client in the program
  useEffect(() => {
    if (programClients.length > 0) {
      const firstClient = programClients[0];
      const dateField = programName === "Basic Manners FYOG" 
        ? 'basic_manners_fyog_dates' 
        : 'basic_manners_group_dates';
      
      if (firstClient[dateField]) {
        setDates({
          commencement_date: firstClient[dateField].commencement_date || '',
          week2_date: firstClient[dateField].week2_date || '',
          week3_date: firstClient[dateField].week3_date || '',
          week4_date: firstClient[dateField].week4_date || '',
          week5_date: firstClient[dateField].week5_date || '',
          week6_date: firstClient[dateField].week6_date || '',
          week7_date: firstClient[dateField].week7_date || ''
        });
      } else {
        // If the date field is empty, clear the dates state to reflect it
        setDates({
          commencement_date: '',
          week2_date: '',
          week3_date: '',
          week4_date: '',
          week5_date: '',
          week6_date: '',
          week7_date: ''
        });
      }
    } else {
      // If there are no programClients, clear the dates state
      setDates({
        commencement_date: '',
        week2_date: '',
        week3_date: '',
        week4_date: '',
        week5_date: '',
        week6_date: '',
        week7_date: ''
      });
    }
  }, [clients, programName]); // Corrected dependencies: `clients` and `programName` will trigger re-evaluation of `programClients`

  const handleDateChange = async (field, value) => {
    const updatedDates = {
      ...dates,
      [field]: value
    };
    
    setDates(updatedDates);
    
    // Auto-save when date changes
    setSaving(true);
    try {
      // Determine which date field to update based on program
      const dateField = programName === "Basic Manners FYOG" 
        ? 'basic_manners_fyog_dates' 
        : 'basic_manners_group_dates';
      
      // Update all clients in this program with the new dates
      for (const client of programClients) {
        await Client.update(client.id, {
          [dateField]: updatedDates
        });
      }
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error saving dates:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Calendar className="w-5 h-5" />
          {programName} Schedule (7 Weeks)
          {saving && <span className="text-sm font-normal text-slate-500 ml-2">Saving...</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commencement_date">Week 1 - Commencement</Label>
            <Input
              id="commencement_date"
              type="date"
              value={dates.commencement_date}
              onChange={(e) => handleDateChange('commencement_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week2_date">Week 2</Label>
            <Input
              id="week2_date"
              type="date"
              value={dates.week2_date}
              onChange={(e) => handleDateChange('week2_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week3_date">Week 3</Label>
            <Input
              id="week3_date"
              type="date"
              value={dates.week3_date}
              onChange={(e) => handleDateChange('week3_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week4_date">Week 4</Label>
            <Input
              id="week4_date"
              type="date"
              value={dates.week4_date}
              onChange={(e) => handleDateChange('week4_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week5_date">Week 5</Label>
            <Input
              id="week5_date"
              type="date"
              value={dates.week5_date}
              onChange={(e) => handleDateChange('week5_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week6_date">Week 6</Label>
            <Input
              id="week6_date"
              type="date"
              value={dates.week6_date}
              onChange={(e) => handleDateChange('week6_date', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="week7_date">Week 7</Label>
            <Input
              id="week7_date"
              type="date"
              value={dates.week7_date}
              onChange={(e) => handleDateChange('week7_date', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
