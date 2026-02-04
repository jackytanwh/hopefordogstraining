import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, Calendar, ChevronDown } from "lucide-react";
import { Client } from "@/entities/Client";

const curriculumData = {
  week1: {
    title: "Week 1",
    items: [
      { key: "lets_go_1", label: '"Let\'s Go!" (Step 1)' },
      { key: "sit_lure", label: 'Sit using lure + Hand cue' },
      { key: "body_language", label: 'Understanding body language (Refer to handout)' },
      { key: "check_in_1", label: 'Check-in cue (Part 1, using whistle & verbal cue)' },
      { key: "discussion", label: 'Discussion' }
    ]
  },
  week2: {
    title: "Week 2",
    items: [
      { key: "pattern_game_1", label: '1,2,3 Pattern game (Step 1)' },
      { key: "lets_go_2", label: 'Let\'s Go (Step 2, Adding distance)' },
      { key: "sit_verbal", label: 'Sit + verbal cue "Sit"' },
      { key: "down_lure", label: 'Down cue using luring (on mat)' },
      { key: "check_in_proof", label: 'Check-in cue (Proofing)' }
    ]
  },
  week3: {
    title: "Week 3",
    items: [
      { key: "pattern_game_2", label: '1,2,3 Pattern game (Step 2)' },
      { key: "lets_go_uturn", label: 'Let\'s Go, double U-turn' },
      { key: "down_verbal", label: 'Down + verbal cue' },
      { key: "down_stay_duration", label: 'Down-Stay (Duration)' },
      { key: "anchor_cue_1", label: 'Anchor cue (Step 1)' }
    ]
  },
  week4: {
    title: "Week 4",
    items: [
      { key: "pattern_game_3", label: '1,2,3 Pattern game + Sit (Fading treats)' },
      { key: "lets_go_pace", label: 'Let\'s Go (Changing pace)' },
      { key: "down_stay_distance", label: 'Down-Stay (Distance)' },
      { key: "anchor_proof", label: 'Proof the anchor cue' },
      { key: "leave_it_1", label: 'Leave It (Steps 1)' },
      { key: "say_hello", label: 'Say hello! 3 secs' }
    ]
  },
  week5: {
    title: "Week 5",
    items: [
      { key: "pattern_game_4", label: '1,2,3 Pattern game + Down' },
      { key: "down_stay_distractions", label: 'Down-Stay (Distractions)' },
      { key: "double_recall", label: 'Double recall (Variable reinforcement)' },
      { key: "recall_sit_5m", label: 'Recall & sit (5m)' },
      { key: "leave_it_2", label: 'Leave It (Step 2)' },
      { key: "say_hello_2", label: 'Say hello! 3 secs' }
    ]
  },
  week6: {
    title: "Week 6",
    items: [
      { key: "lets_go_pattern_proof", label: 'Let\'s Go + 1,2,3 Pattern game (Proofing)' },
      { key: "down_stay_proof", label: 'Down-Stay (Distractions/Distance/Duration)' },
      { key: "double_recall_var", label: 'Double recall (Variable reinforcement)' },
      { key: "recall_sit_10m", label: 'Recall & sit (10m)' },
      { key: "leave_it_3", label: 'Leave It + Let\'s Go (Step 3, Walk past distractions)' }
    ]
  },
  week7: {
    title: "Week 7",
    items: [
      { key: "pattern_game_proof", label: '1,2,3 Pattern game (Proofing)' },
      { key: "down_stay_final", label: 'Down-Stay (Proofing)' },
      { key: "triangle_success", label: 'Triangle of Success (Refer handout)' },
      { key: "recall_sit_final", label: 'Recall & sit (10m)' },
      { key: "leave_it_final", label: 'Leave it + Let\'s Go' }
    ]
  }
};

export default function BasicMannersGroupFYOGCurriculum({ clients, onUpdate, programName = "Basic Manners FYOG" }) {
  const [expandedWeeks, setExpandedWeeks] = useState({
    week1: true,
    week2: false,
    week3: false,
    week4: false,
    week5: false,
    week6: false,
    week7: false
  });

  const [groupStartDate, setGroupStartDate] = useState('');

  const toggleWeek = (weekKey) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  const handleItemToggle = async (clientId, week, itemKey, checked) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const updatedProgress = {
      ...(client.basic_manners_fyog_progress || {}),
      [week]: {
        ...(client.basic_manners_fyog_progress?.[week] || {}),
        [itemKey]: checked
      }
    };

    await Client.update(clientId, {
      basic_manners_fyog_progress: updatedProgress
    });

    if (onUpdate) onUpdate();
  };

  const getClientWeekProgress = (client, week) => {
    const weekData = curriculumData[week];
    const weekProgress = client.basic_manners_fyog_progress?.[week] || {};
    const completed = weekData.items.filter(item => weekProgress[item.key]).length;
    return { completed, total: weekData.items.length };
  };

  return (
    <div className="space-y-6">
      {clients.map((client) => (
        <Card key={client.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center justify-between text-xl font-semibold text-slate-900">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {programName} Curriculum - {client.dog_name}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Group Start Date (Week 1)
              </label>
              <input
                type="date"
                value={groupStartDate}
                onChange={(e) => setGroupStartDate(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {groupStartDate && (
                <p className="text-xs text-slate-600 mt-2">
                  Week 2: {new Date(new Date(groupStartDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}, 
                  Week 3: {new Date(new Date(groupStartDate).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}, etc.
                </p>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(curriculumData).map(([weekKey, weekData]) => {
                const { completed, total } = getClientWeekProgress(client, weekKey);
                const weekProgress = client.basic_manners_fyog_progress?.[weekKey] || {};
                const isExpanded = expandedWeeks[weekKey];
                
                return (
                  <div key={weekKey} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleWeek(weekKey)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown 
                          className={`w-5 h-5 text-slate-500 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                        <h3 className="text-lg font-semibold text-slate-900">{weekData.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">{completed}/{total}</span>
                        {completed === total && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-100">
                        {weekData.items.map((item) => (
                          <div key={item.key} className="flex items-start gap-3">
                            <Checkbox
                              id={`${client.id}-${weekKey}-${item.key}`}
                              checked={weekProgress[item.key] || false}
                              onCheckedChange={(checked) => handleItemToggle(client.id, weekKey, item.key, checked)}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`${client.id}-${weekKey}-${item.key}`}
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
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}