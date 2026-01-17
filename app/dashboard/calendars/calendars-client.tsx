"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { CalendarDialog } from "@/components/calendar-dialog"
import { CalendarEventDialog } from "@/components/calendar-event-dialog"
import { CalendarGroupDialog } from "@/components/calendar-group-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { deleteCalendar, removeEventFromDate, checkCanEditCalendar } from "@/app/actions/calendars"
import { getEventTypes } from "@/app/actions/event-types"
import {
  PlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Group = { id: string; title: string; defaultRole: string }

type EventTypeData = {
  id: string
  name: string
}

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date | null
  eventTypeId: string
  eventType: EventTypeData
}

type Calendar = {
  id: string
  name: string
  description: string | null
  createdById: string
  createdBy: { id: string; name: string }
  createdAt: Date
  events: CalendarEvent[]
  groups: { id: string; group: Group }[]
}

interface CalendarsClientProps {
  calendars: Calendar[]
  groups: Group[]
  isHOD: boolean
  userId: string
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

// Week starts on Monday
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// Default colors for known event types
const DEFAULT_EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Holiday: { bg: "bg-green-500/20", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  Exam: { bg: "bg-red-500/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  Academic: { bg: "bg-blue-500/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  Event: { bg: "bg-purple-500/20", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  Other: { bg: "bg-gray-500/20", text: "text-gray-700 dark:text-gray-400", dot: "bg-gray-500" },
}

// Fallback color for unknown event types
const FALLBACK_COLOR = { bg: "bg-gray-500/20", text: "text-gray-700 dark:text-gray-400", dot: "bg-gray-500" }

// Array of additional colors for dynamically created event types
const DYNAMIC_COLORS = [
  { bg: "bg-orange-500/20", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  { bg: "bg-teal-500/20", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-500" },
  { bg: "bg-pink-500/20", text: "text-pink-700 dark:text-pink-400", dot: "bg-pink-500" },
  { bg: "bg-indigo-500/20", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  { bg: "bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  { bg: "bg-cyan-500/20", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
]

// Simple hash function to get consistent color index from event type name
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Get color for an event type by name - uses hash for consistent colors
function getEventTypeColorByName(eventTypeName: string) {
  // Check if it's a known default type
  if (DEFAULT_EVENT_TYPE_COLORS[eventTypeName]) {
    return DEFAULT_EVENT_TYPE_COLORS[eventTypeName]
  }
  // Use hash of name to get consistent color
  const colorIndex = hashString(eventTypeName) % DYNAMIC_COLORS.length
  return DYNAMIC_COLORS[colorIndex]
}

export function CalendarsClient({
  calendars,
  groups,
  isHOD,
  userId,
}: CalendarsClientProps) {
  const router = useRouter()
  const [selectedCalendar, setSelectedCalendar] = React.useState<Calendar | null>(
    calendars.length > 0 ? calendars[0] : null
  )
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [canEdit, setCanEdit] = React.useState(isHOD)
  const [eventTypes, setEventTypes] = React.useState<EventTypeData[]>([])
  const [selectedPanelDate, setSelectedPanelDate] = React.useState<Date | null>(null)

  // Dialog states
  const [calendarDialogOpen, setCalendarDialogOpen] = React.useState(false)
  const [editingCalendar, setEditingCalendar] = React.useState<Calendar | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingCalendar, setDeletingCalendar] = React.useState<Calendar | null>(null)
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = React.useState(false)
  const [deletingEvent, setDeletingEvent] = React.useState<{ event: CalendarEvent; date: Date } | null>(null)

  // Load event types for legend
  React.useEffect(() => {
    getEventTypes().then(setEventTypes)
  }, [])

  // Check edit permission when calendar changes
  React.useEffect(() => {
    if (selectedCalendar && !isHOD) {
      checkCanEditCalendar(selectedCalendar.id).then(setCanEdit)
    } else if (isHOD) {
      setCanEdit(true)
    }
  }, [selectedCalendar, isHOD])

  // Update selected calendar when calendars change
  React.useEffect(() => {
    if (selectedCalendar) {
      const updated = calendars.find((c) => c.id === selectedCalendar.id)
      if (updated) {
        setSelectedCalendar(updated)
      } else if (calendars.length > 0) {
        setSelectedCalendar(calendars[0])
      } else {
        setSelectedCalendar(null)
      }
    } else if (calendars.length > 0) {
      setSelectedCalendar(calendars[0])
    }
  }, [calendars])

  const handleRefresh = () => {
    router.refresh()
  }

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar grid data (Monday-start week)
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday-start (0 = Monday, 6 = Sunday)
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startingDayOfWeek < 0) startingDayOfWeek = 6
    
    const daysInMonth = lastDayOfMonth.getDate()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Add days from previous month
    const prevMonth = new Date(year, month, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      })
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // Add days from next month to complete the grid (6 weeks max)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    return days
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!selectedCalendar) return []
    
    return selectedCalendar.events.filter((event) => {
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate
      
      // Normalize dates to compare just year/month/day
      const dateNorm = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const startNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      
      return dateNorm >= startNorm && dateNorm <= endNorm
    })
  }

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if date is selected in panel
  const isSelectedPanelDate = (date: Date): boolean => {
    if (!selectedPanelDate) return false
    return (
      date.getDate() === selectedPanelDate.getDate() &&
      date.getMonth() === selectedPanelDate.getMonth() &&
      date.getFullYear() === selectedPanelDate.getFullYear()
    )
  }

  // Format date for display
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Handle date selection in calendar grid
  const handleDateClick = (date: Date) => {
    // Toggle selection if clicking the same date
    if (selectedPanelDate && isSelectedPanelDate(date)) {
      setSelectedPanelDate(null)
    } else {
      setSelectedPanelDate(date)
    }
  }

  // Get events for selected panel date
  const selectedDateEvents = selectedPanelDate ? getEventsForDate(selectedPanelDate) : []

  // Handle calendar actions
  const handleCreateCalendar = () => {
    setEditingCalendar(null)
    setCalendarDialogOpen(true)
  }

  const handleDeleteCalendar = (calendar: Calendar) => {
    setDeletingCalendar(calendar)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCalendar = async () => {
    if (!deletingCalendar) return
    const result = await deleteCalendar(deletingCalendar.id)
    if (!result.error) {
      handleRefresh()
    }
    setDeleteDialogOpen(false)
    setDeletingCalendar(null)
  }

  // Handle event actions
  const handleAddEvent = (date?: Date) => {
    setEditingEvent(null)
    setSelectedDate(date || new Date())
    setEventDialogOpen(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setSelectedDate(new Date(event.startDate))
    setEventDialogOpen(true)
  }

  const handleDeleteEvent = (event: CalendarEvent, date: Date) => {
    setDeletingEvent({ event, date })
    setDeleteEventDialogOpen(true)
  }

  // Helper to format date as YYYY-MM-DD using local time (not UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const confirmDeleteEvent = async () => {
    if (!deletingEvent) return
    // Pass date as YYYY-MM-DD to avoid timezone issues
    const result = await removeEventFromDate(deletingEvent.event.id, formatDateLocal(deletingEvent.date))
    if (!result.error) {
      handleRefresh()
    }
    setDeleteEventDialogOpen(false)
    setDeletingEvent(null)
  }

  // Handle group assignment
  const handleManageGroups = () => {
    setGroupDialogOpen(true)
  }

  const calendarDays = getCalendarDays()

  // Get color for an event type - uses hash-based consistent colors
  const getColorForEventType = (typeName: string) => {
    return getEventTypeColorByName(typeName)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendars</h1>
          <p className="text-muted-foreground text-sm">
            {isHOD
              ? "Create and manage calendars for your department."
              : "View your assigned calendars."}
          </p>
        </div>
        {isHOD && (
          <Button onClick={handleCreateCalendar}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Calendar
          </Button>
        )}
      </div>

      {calendars.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Calendars</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isHOD
                ? "Create your first calendar to get started."
                : "You don't have any calendars assigned yet."}
            </p>
            {isHOD && (
              <Button onClick={handleCreateCalendar}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Calendar
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left Panel - Calendar List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Calendars</h3>
            {calendars.map((calendar) => (
              <Card
                key={calendar.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedCalendar?.id === calendar.id ? "border-primary bg-accent" : ""
                }`}
                onClick={() => setSelectedCalendar(calendar)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{calendar.name}</CardTitle>
                      {calendar.description && (
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {calendar.description}
                        </CardDescription>
                      )}
                    </div>
                    {isHOD && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedCalendar(calendar)
                            setEditingCalendar(calendar)
                            setCalendarDialogOpen(true)
                          }}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCalendar(calendar)
                            handleManageGroups()
                          }}>
                            <UsersIcon className="mr-2 h-4 w-4" />
                            Manage Groups
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteCalendar(calendar)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {isHOD && calendar.groups.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {calendar.groups.slice(0, 3).map((g) => (
                        <Badge key={g.id} variant="secondary" className="text-xs">
                          {g.group.title}
                        </Badge>
                      ))}
                      {calendar.groups.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{calendar.groups.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}

            {/* Selected Date Events Panel */}
            {selectedPanelDate && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">{formatDisplayDate(selectedPanelDate)}</CardTitle>
                      <CardDescription>
                        {selectedDateEvents.length === 0 
                          ? "No events" 
                          : `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? 's' : ''}`}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon-xs"
                      onClick={() => setSelectedPanelDate(null)}
                      title="Close panel"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {canEdit && (
                    <Button 
                      size="sm" 
                      className="w-full mb-3"
                      onClick={() => handleAddEvent(selectedPanelDate)}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  )}

                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateEvents.map((event) => {
                        const colors = getColorForEventType(event.eventType.name)
                        const startDateStr = new Date(event.startDate).toLocaleDateString()
                        const endDateStr = event.endDate ? new Date(event.endDate).toLocaleDateString() : null
                        
                        return (
                          <div 
                            key={event.id}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", colors.dot)} />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm break-words">{event.title}</h4>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <Badge variant="secondary" className={cn("text-xs", colors.bg, colors.text)}>
                                    {event.eventType.name}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                  {startDateStr}
                                  {endDateStr && endDateStr !== startDateStr && ` - ${endDateStr}`}
                                </p>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleEditEvent(event)}
                                    title="Edit event"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteEvent(event, selectedPanelDate)}
                                    title="Delete event"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Calendar Grid */}
          {selectedCalendar && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedCalendar.name}</CardTitle>
                    <CardDescription>
                      {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-px mb-px">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2 bg-muted/30"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-border">
                  {calendarDays.map((dayData, idx) => {
                    const events = getEventsForDate(dayData.date)
                    const today = isToday(dayData.date)
                    const isSelected = isSelectedPanelDate(dayData.date)
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[140px] p-2 bg-background transition-colors cursor-pointer hover:bg-accent/30",
                          !dayData.isCurrentMonth && "bg-muted/20",
                          isSelected && "ring-2 ring-primary ring-inset bg-accent/50"
                        )}
                        onClick={() => handleDateClick(dayData.date)}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                          today && "bg-primary text-primary-foreground",
                          !dayData.isCurrentMonth && "text-muted-foreground"
                        )}>
                          {dayData.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {events.slice(0, 2).map((event) => {
                            const colors = getColorForEventType(event.eventType.name)
                            return (
                              <div
                                key={event.id}
                                className={cn(
                                  "text-xs px-1.5 py-1 rounded",
                                  colors.bg,
                                  colors.text
                                )}
                                title={event.title}
                              >
                                <span className="block break-words whitespace-normal">{event.title}</span>
                              </div>
                            )
                          })}
                          {events.length > 2 && (
                            <div className="text-xs text-muted-foreground px-1.5">
                              +{events.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CalendarDialog
        open={calendarDialogOpen}
        onOpenChange={setCalendarDialogOpen}
        initialData={editingCalendar ? {
          id: editingCalendar.id,
          name: editingCalendar.name,
          description: editingCalendar.description
        } : undefined}
        onSuccess={handleRefresh}
      />

      {selectedCalendar && (
        <>
          <CalendarEventDialog
            open={eventDialogOpen}
            onOpenChange={setEventDialogOpen}
            calendarId={selectedCalendar.id}
            initialDate={selectedDate || undefined}
            initialData={editingEvent ? {
              id: editingEvent.id,
              title: editingEvent.title,
              description: editingEvent.description,
              startDate: new Date(editingEvent.startDate).toISOString().split('T')[0],
              endDate: editingEvent.endDate ? new Date(editingEvent.endDate).toISOString().split('T')[0] : undefined,
              eventTypeId: editingEvent.eventTypeId
            } : undefined}
            onSuccess={handleRefresh}
          />

          {isHOD && (
            <CalendarGroupDialog
              open={groupDialogOpen}
              onOpenChange={setGroupDialogOpen}
              calendarId={selectedCalendar.id}
              calendarName={selectedCalendar.name}
              assignedGroups={selectedCalendar.groups}
              allGroups={groups}
              onSuccess={handleRefresh}
            />
          )}
        </>
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Calendar"
        description={`Are you sure you want to delete "${deletingCalendar?.name}"? This will also delete all events in this calendar. This action cannot be undone.`}
        onConfirm={confirmDeleteCalendar}
      />

      <DeleteDialog
        open={deleteEventDialogOpen}
        onOpenChange={setDeleteEventDialogOpen}
        title="Remove Event from Date"
        description={deletingEvent ? `Are you sure you want to remove "${deletingEvent.event.title}" from ${deletingEvent.date.toLocaleDateString()}? ` : ""}
        onConfirm={confirmDeleteEvent}
      />
    </div>
  )
}
