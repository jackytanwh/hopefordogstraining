
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, Calendar } from "lucide-react";
import { Client } from "@/entities/Client";
import { format } from "date-fns";

const curriculumData = {
  week1: {
    title: "Week 1",
    items: [
      { key: "intro_theory", label: "Intro and theory (Toys/understanding how dogs learn/potty training/feeding)" },
      { key: "name_recognition", label: "Name recognition" },
      { key: "leash_collar", label: "Leash/collar conditioning" },
      { key: "intro_walks", label: "Introduction to walks (15mins)" },
      { key: "sit_cue_part1", label: "Sit cue (Part I)" }
    ]
  },
  week2: {
    title: "Week 2",
    items: [
      { key: "intro_walks_advanced", label: "Introduction to walks (staircase, elevator etc.)" },
      { key: "sit_cue_part2", label: "Sit cue (II)" },
      { key: "recall_exercise", label: "Recall exercise" },
      { key: "down_cue_part1", label: "Down cue (I)" },
      { key: "chin_rest_part1", label: "Chin rest/watch cue (I)" },
      { key: "handling_grooming", label: "Conditioning for handling/grooming & Introducing brushing/hair dryer (I)" }
    ]
  },
  week3: {
    title: "Week 3",
    items: [
      { key: "down_cue_part2", label: "Down cue (II)" },
      { key: "chin_rest_part2", label: "Chin rest/watch cue (Part II)" },
      { key: "grooming_tools", label: "Introducing grooming tools (II)" },
      { key: "dental_cleaning_part1", label: "Introducing dental cleaning (I)" },
      { key: "cone_muzzle_part1", label: "Introducing cone/muzzle (I)" },
      { key: "showering", label: "Introducing showering (optional)" }
    ]
  },
  week4: {
    title: "Week 4",
    items: [
      { key: "dental_cleaning_part2", label: "Introducing dental cleaning (II)" },
      { key: "novelty_objects", label: "Introducing novelty objects" },
      { key: "scary_sounds", label: "Introducing scary sounds" },
      { key: "cone_muzzle_part2", label: "Introducing cone/muzzle (II)" },
      { key: "household_appliances", label: "Introducing household appliances" },
      { key: "vet_visit", label: "Vet visit acclimatisation" }
    ]
  }
};

export default function CurriculumTracker({ client, onUpdate }) {
  const curriculumProgress = client.kinder_puppy_progress || {};

  const handleItemToggle = async (week, itemKey, checked) => {
    const updatedProgress = {
      ...(client.kinder_puppy_progress || {}),
      [week]: {
        ...(client.kinder_puppy_progress?.[week] || {}),
        [itemKey]: checked
      }
    };

    await Client.update(client.id, {
      kinder_puppy_progress: updatedProgress
    });

    onUpdate();
  };

  const handleWeekDateChange = async (week, date) => {
    // Create a mutable copy of the client's current progress to build upon
    const updatedProgress = {
      ...(client.kinder_puppy_progress || {}),
      [week]: {
        ...(client.kinder_puppy_progress?.[week] || {}),
        week_date: date
      }
    };

    // Auto-populate subsequent weeks if this is week1 and has a date
    if (week === 'week1' && date) {
      const baseDate = new Date(date);
      const weeksToAutoPopulate = ['week2', 'week3', 'week4'];
      
      weeksToAutoPopulate.forEach((weekKey, index) => {
        const weekDate = new Date(baseDate);
        weekDate.setDate(weekDate.getDate() + (7 * (index + 1))); // Add 7 days for each subsequent week
        const formattedDate = weekDate.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

        // Update the specific week in the updatedProgress object
        updatedProgress[weekKey] = {
          ...(client.kinder_puppy_progress?.[weekKey] || {}), // Keep existing data for the week
          week_date: formattedDate // Overwrite or set the week_date
        };
      });
    }

    await Client.update(client.id, {
      kinder_puppy_progress: updatedProgress
    });

    onUpdate();
  };

  const getWeekProgress = (week) => {
    const weekData = curriculumData[week];
    const weekProgress = curriculumProgress[week] || {};
    const completed = weekData.items.filter(item => weekProgress[item.key]).length;
    return { completed, total: weekData.items.length };
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <BookOpen className="w-5 h-5" />
          Kinder Puppy Curriculum
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {Object.entries(curriculumData).map(([weekKey, weekData]) => {
            const { completed, total } = getWeekProgress(weekKey);
            const weekProgress = curriculumProgress[weekKey] || {};
            
            return (
              <div key={weekKey} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-slate-900">{weekData.title}</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <Input
                        type="date"
                        value={weekProgress.week_date || ''}
                        onChange={(e) => handleWeekDateChange(weekKey, e.target.value)}
                        className="w-40 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{completed}/{total}</span>
                    {completed === total && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {weekData.items.map((item) => (
                    <div key={item.key} className="flex items-start gap-3">
                      <Checkbox
                        id={`${weekKey}-${item.key}`}
                        checked={weekProgress[item.key] || false}
                        onCheckedChange={(checked) => handleItemToggle(weekKey, item.key, checked)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`${weekKey}-${item.key}`}
                        className={`text-sm cursor-pointer flex-1 ${
                          weekProgress[item.key] 
                            ? 'text-slate-500 line-through' 
                            : 'text-slate-700'
                        }`}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
