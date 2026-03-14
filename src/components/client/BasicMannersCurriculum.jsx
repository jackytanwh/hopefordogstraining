
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, Calendar, GraduationCap } from "lucide-react";
import { Client } from "@/entities/Client";
import { format } from "date-fns";

const curriculumData = {
  week1: {
    title: "Week 1",
    items: [
      { key: "check_in_1", label: "Check-in cue (Part 1, Step 1 & 2)" },
      { key: "lets_go_1", label: "Let’s Go (Step 1)" },
      { key: "sit_lure", label: "Sit using lure + hand cue" },
      { key: "scatter_feeding", label: "Scatter feeding" },
      { key: "body_language_theory", label: "Discussion: Body Language (Theory)" }
    ]
  },
  week2: {
    title: "Week 2",
    items: [
      { key: "pattern_game_1", label: "123 Pattern Game + right turn" },
      { key: "lets_go_2", label: "Let’s Go (add distance, Step 2)" },
      { key: "sit_verbal", label: "Sit + verbal cue" },
      { key: "check_in_2", label: "Proof the check-in cue (Part 1, Step 3)" },
      { key: "down_lure", label: "Down using a lure" }
    ]
  },
  week3: {
    title: "Week 3",
    items: [
      { key: "pattern_game_2", label: "123 Pattern Game + left turn" },
      { key: "sit_stay_distraction", label: "Sit-Stay (Distraction)" },
      { key: "down_verbal", label: "Down + verbal cue" },
      { key: "anchor_cue_1", label: "Anchor cue (Part 1, Step 1)" },
      { key: "down_stay_duration", label: "Down-stay (Duration)" },
      { key: "leave_it_1", label: "Leave it (Step 1)" }
    ]
  },
  week4: {
    title: "Week 4",
    items: [
      { key: "pattern_game_3", label: "123 Pattern Game + Sit (fade the treats)" },
      { key: "anchor_cue_2", label: "Proof the anchor cue (Part 2, Step 3)" },
      { key: "down_stay_distance", label: "Down-Stay (Distance)" },
      { key: "leave_it_2", label: "Leave it (fade in with treats on floor)" }
    ]
  },
  week5: {
    title: "Week 5",
    items: [
      { key: "pattern_game_4", label: "123 Pattern Game + Down" },
      { key: "down_stay_distractions", label: "Down-Stay (Distractions)" },
      { key: "double_recall_1", label: "Double recall (Part 3, Step 1)" },
      { key: "recall_sit", label: "Recall sit in front" },
      { key: "leave_it_3", label: "Leave it (dog on the move) + Let’s Go" }
    ]
  },
  week6: {
    title: "Week 6",
    items: [
      { key: "pattern_game_5", label: "123 Pattern Game + Sit/Down" },
      { key: "double_recall_2", label: "Double recall (Part 3, Step 2)" },
      { key: "recall_sit_distance", label: "Recall sit in front (5-10m)" },
      { key: "down_stay_proof", label: "Down-Stay (3m, 1 min + Distractions)" },
      { key: "leave_it_proof", label: "Proof the Leave it (Triangle of Success)" }
    ]
  }
};

export default function BasicMannersCurriculum({ client, onUpdate }) {
  const curriculumProgress = client.basic_manners_progress || {};

  const handleItemToggle = async (week, itemKey, checked) => {
    const updatedProgress = {
      ...(client.basic_manners_progress || {}),
      [week]: {
        ...(client.basic_manners_progress?.[week] || {}),
        [itemKey]: checked
      }
    };

    await Client.update(client.id, {
      basic_manners_progress: updatedProgress
    });

    onUpdate();
  };

  const handleWeekDateChange = async (week, date) => {
    const updatedProgress = {
      ...(client.basic_manners_progress || {}),
      [week]: {
        ...(client.basic_manners_progress?.[week] || {}),
        week_date: date
      }
    };

    // Auto-populate subsequent weeks if this is week1 and has a date
    if (week === 'week1' && date) {
      const baseDate = new Date(date);
      const weeks = ['week2', 'week3', 'week4', 'week5', 'week6'];
      
      weeks.forEach((weekKey, index) => {
        const weekDate = new Date(baseDate);
        weekDate.setDate(weekDate.getDate() + (7 * (index + 1))); // Add 7 days for each subsequent week
        const formattedDate = weekDate.toISOString().split('T')[0];
        
        updatedProgress[weekKey] = {
          ...(client.basic_manners_progress?.[weekKey] || {}), // Preserve existing items for this week
          week_date: formattedDate
        };
      });
    }

    await Client.update(client.id, {
      basic_manners_progress: updatedProgress
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
          <GraduationCap className="w-5 h-5" />
          Basic Manners In-Home Curriculum
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
