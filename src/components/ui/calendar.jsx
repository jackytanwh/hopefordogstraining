import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-6", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6",
        caption: "flex justify-center pt-1 relative items-center mb-6",
        caption_label: "text-2xl font-bold text-slate-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 bg-transparent p-0 opacity-80 hover:opacity-100 hover:bg-slate-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-4",
        head_cell:
          "text-slate-700 font-bold text-sm w-14 text-center uppercase tracking-wide [&:nth-child(6)]:text-red-500 [&:nth-child(7)]:text-red-500 pb-3 border-b-2 border-slate-200",
        row: "flex w-full mt-3",
        cell: "h-14 w-14 text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-14 w-14 p-0 font-semibold text-lg aria-selected:opacity-100 hover:bg-slate-100 rounded-lg transition-all"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-cyan-200 text-slate-900 hover:bg-cyan-300 hover:text-slate-900 focus:bg-cyan-300 focus:text-slate-900 rounded-lg",
        day_today: "bg-slate-100 text-slate-900 font-bold",
        day_outside:
          "day-outside text-slate-300 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-30",
        day_disabled: "text-slate-300 opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-slate-100 aria-selected:text-slate-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-6 w-6 text-slate-700" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-6 w-6 text-slate-700" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }