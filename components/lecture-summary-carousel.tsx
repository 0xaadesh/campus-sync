"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatTime } from "@/lib/utils"
import { Calendar, Clock, MapPin, User, BookOpen, Coffee, Layers, ChevronLeft, ChevronRight, FileText, Plus, Eye, Edit } from "lucide-react"
import type { LectureSummarySlot } from "@/app/actions/lecture-summaries"
import { getFacultyScheduleWithSummaries } from "@/app/actions/lecture-summaries"
import { DayOfWeek } from "@prisma/client"
import { LectureSummaryDialog } from "@/components/lecture-summary-dialog"

interface LectureSummaryCarouselProps {
  initialSlots: LectureSummarySlot[]
  todayDate: string
  userRole: string
  canEdit: boolean
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday"
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun"
}

function getDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay()
  const mapping: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
  return mapping[dayIndex]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function generateDates(centerDate: Date, daysBefore: number, daysAfter: number): Date[] {
  const dates: Date[] = []
  for (let i = -daysBefore; i <= daysAfter; i++) {
    dates.push(addDays(centerDate, i))
  }
  return dates
}

export function LectureSummaryCarousel({ initialSlots, todayDate, userRole, canEdit }: LectureSummaryCarouselProps) {
  const today = React.useMemo(() => new Date(todayDate), [todayDate])
  
  const [selectedDate, setSelectedDate] = React.useState<Date>(today)
  const [rangeCenter, setRangeCenter] = React.useState<Date>(today)
  const [slots, setSlots] = React.useState<LectureSummarySlot[]>(initialSlots)
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedSlot, setSelectedSlot] = React.useState<LectureSummarySlot | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  
  const DAYS_BEFORE = 14
  const DAYS_AFTER = 14
  
  const visibleDates = React.useMemo(() => 
    generateDates(rangeCenter, DAYS_BEFORE, DAYS_AFTER),
    [rangeCenter]
  )
  
  const selectedIndex = React.useMemo(() => {
    return visibleDates.findIndex(d => isSameDay(d, selectedDate))
  }, [visibleDates, selectedDate])
  
  const selectedDayOfWeek = getDayOfWeek(selectedDate)
  const isToday = isSameDay(selectedDate, today)
  const selectedDateStr = selectedDate.toISOString().split('T')[0]

  // Fetch slots when date changes
  const fetchSlots = React.useCallback(async (date: Date) => {
    setIsLoading(true)
    try {
      const dateStr = date.toISOString().split('T')[0]
      const result = await getFacultyScheduleWithSummaries(dateStr)
      setSlots(result.slots)
    } catch (error) {
      console.error("Failed to fetch slots:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSlots(selectedDate)
  }, [selectedDate, fetchSlots])

  const handlePrevious = () => {
    const newCenter = addDays(rangeCenter, -7)
    setRangeCenter(newCenter)
  }

  const handleNext = () => {
    const newCenter = addDays(rangeCenter, 7)
    setRangeCenter(newCenter)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    
    const dateIndex = visibleDates.findIndex(d => isSameDay(d, date))
    if (dateIndex <= 3) {
      setRangeCenter(addDays(rangeCenter, -7))
    } else if (dateIndex >= visibleDates.length - 4) {
      setRangeCenter(addDays(rangeCenter, 7))
    }
  }

  const handleGoToToday = () => {
    setSelectedDate(today)
    setRangeCenter(today)
  }

  const handleOpenDialog = (slot: LectureSummarySlot) => {
    setSelectedSlot(slot)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedSlot(null)
  }

  const handleSaved = () => {
    fetchSlots(selectedDate)
  }

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    if (scrollContainerRef.current && selectedIndex >= 0) {
      const container = scrollContainerRef.current
      const items = container.querySelectorAll('[data-date-item]')
      const selectedItem = items[selectedIndex] as HTMLElement
      if (selectedItem) {
        const containerWidth = container.offsetWidth
        const itemLeft = selectedItem.offsetLeft
        const itemWidth = selectedItem.offsetWidth
        const scrollTo = itemLeft - (containerWidth / 2) + (itemWidth / 2)
        container.scrollTo({ left: scrollTo, behavior: 'smooth' })
      }
    }
  }, [selectedIndex, visibleDates])

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-2 px-1 py-1">
              {visibleDates.map((date) => {
                const dayOfWeek = getDayOfWeek(date)
                const isSelected = isSameDay(date, selectedDate)
                const isCurrentDay = isSameDay(date, today)
                
                return (
                  <button
                    key={date.toISOString()}
                    data-date-item
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "flex-shrink-0 w-16 rounded-lg border p-2 text-center transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted",
                      isCurrentDay && !isSelected && "ring-2 ring-primary/30"
                    )}
                  >
                    <div className="text-xs font-medium opacity-80">
                      {isCurrentDay ? "Today" : DAY_SHORT[dayOfWeek]}
                    </div>
                    <div className="text-lg font-bold">
                      {date.getDate()}
                    </div>
                    <div className="text-xs opacity-70">
                      {DAY_SHORT[dayOfWeek]}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {!isToday && (
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToToday}
              className="text-xs"
            >
              Go to Today
            </Button>
          </div>
        )}
      </div>

      {/* Current Day Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            {DAY_NAMES[selectedDayOfWeek]}
            {isToday && (
              <Badge variant="secondary" className="ml-2">
                Today
              </Badge>
            )}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatDateDisplay(selectedDate)}
        </span>
      </div>

      {/* Role Info */}
      <div className="rounded-lg border p-3 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          {canEdit ? (
            <>
              <FileText className="h-4 w-4 inline mr-2" />
              You can add or edit summaries for your assigned lectures below.
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 inline mr-2" />
              View lecture summaries shared by your faculty. Click on a summarized slot to view details.
            </>
          )}
        </p>
      </div>

      {/* Schedule Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-sm text-muted-foreground">Loading schedule...</p>
            </CardContent>
          </Card>
        ) : slots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Coffee className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {canEdit ? "No lectures assigned to you" : "No lectures scheduled"}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {canEdit ? "You don't have any lectures on this day." : "Enjoy your day off!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          slots.map((slot) => (
            <Card 
              key={slot.id} 
              className={cn(
                "transition-all",
                slot.isBreak && "bg-muted/50 border-dashed"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={slot.isBreak ? "outline" : "default"}
                      className="shrink-0"
                    >
                      {slot.slotTypeName}
                    </Badge>
                    {slot.batchName && (
                      <Badge variant="secondary" className="shrink-0">
                        <Layers className="h-3 w-3 mr-1" />
                        {slot.batchName}
                      </Badge>
                    )}
                    {slot.summary && (
                      <Badge variant="success" className="shrink-0">
                        Summarized
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {slot.isBreak ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coffee className="h-4 w-4" />
                    <span className="text-sm">Break Time</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slot.subjectName && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{slot.subjectName}</span>
                        {slot.subjectShortName && (
                          <span className="text-sm text-muted-foreground">
                            ({slot.subjectShortName})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {slot.roomNumber && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>Room {slot.roomNumber}</span>
                        </div>
                      )}
                      {slot.facultyName && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{slot.facultyName}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-2">
                      {canEdit ? (
                        <Button
                          variant={slot.summary ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleOpenDialog(slot)}
                        >
                          {slot.summary ? (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Summary
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Summary
                            </>
                          )}
                        </Button>
                      ) : slot.summary ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(slot)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Summary
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No summary available yet
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Dialog */}
      {selectedSlot && (
        <LectureSummaryDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          slot={selectedSlot}
          selectedDate={selectedDateStr}
          canEdit={canEdit}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
