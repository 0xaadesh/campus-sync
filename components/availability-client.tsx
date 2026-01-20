"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn, formatTime } from "@/lib/utils"
import { Users, DoorOpen, Clock, User, Calendar, Search } from "lucide-react"
import type {
  FacultyWithSlots,
  SlotWithFreeFaculty,
  RoomWithSlots,
  SlotWithFreeRooms,
  DayOfWeek,
  FacultyInfo
} from "@/app/actions/availability"

interface AvailabilityClientProps {
  facultyData: {
    facultyWise: FacultyWithSlots[]
    slotWise: SlotWithFreeFaculty[]
  }
  roomData: {
    roomWise: RoomWithSlots[]
    slotWise: SlotWithFreeRooms[]
  }
}

type ViewMode = "entity" | "slot"

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAY_ABBREV: Record<DayOfWeek, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun"
}

// Get today's day of week
function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay()
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const mapping: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return mapping[dayIndex]
}

function getAvailabilityColor(availability: "Active" | "Away" | "Busy") {
  switch (availability) {
    case "Active": return "bg-green-500"
    case "Away": return "bg-red-500"
    case "Busy": return "bg-yellow-500"
  }
}

function getAvailabilityBadgeVariant(availability: "Active" | "Away" | "Busy") {
  switch (availability) {
    case "Active": return "default"
    case "Away": return "destructive"
    case "Busy": return "secondary"
  }
}

function FacultyAvatar({ faculty, size = "md" }: { faculty: FacultyInfo; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"

  return (
    <div className="relative">
      <div className={cn(
        "bg-primary/10 text-primary flex items-center justify-center rounded-full font-medium",
        sizeClasses
      )}>
        {faculty.name.charAt(0).toUpperCase()}
      </div>
      <span
        className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-background",
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
          getAvailabilityColor(faculty.availability)
        )}
      />
    </div>
  )
}

function FacultyWiseView({ data }: { data: FacultyWithSlots[] }) {
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>(getTodayDayOfWeek)
  const [showOccupied, setShowOccupied] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredData = data
    .filter(faculty =>
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(faculty => ({
      ...faculty,
      occupiedSlots: faculty.occupiedSlots.filter(s => s.day === selectedDay),
      freeSlots: faculty.freeSlots.filter(s => s.day === selectedDay)
    }))

  // Helper to format slot badge text
  const formatSlotBadge = (slot: FacultyWithSlots["occupiedSlots"][0], showDay: boolean) => {
    const parts: string[] = []
    if (showDay) parts.push(DAY_ABBREV[slot.day])
    parts.push(`${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`)
    if (slot.subjectShortName) parts.push(slot.subjectShortName)
    if (slot.roomNumber) parts.push(`R:${slot.roomNumber}`)
    if (slot.batchName) parts.push(`B:${slot.batchName}`)
    return parts.join(" · ")
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search faculty by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Day filter */}
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(day)}
            >
              {DAY_ABBREV[day]}
            </Button>
          ))}
        </div>

        {/* Free/Occupied toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="faculty-slot-toggle" className={cn("text-sm", !showOccupied && "text-green-600 dark:text-green-400 font-medium")}>
            Free
          </Label>
          <Switch
            id="faculty-slot-toggle"
            checked={showOccupied}
            onCheckedChange={setShowOccupied}
          />
          <Label htmlFor="faculty-slot-toggle" className={cn("text-sm", showOccupied && "text-red-600 dark:text-red-400 font-medium")}>
            Occupied
          </Label>
        </div>
      </div>

      {/* Faculty cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map(faculty => {
          const slots = showOccupied ? faculty.occupiedSlots : faculty.freeSlots

          return (
            <Card key={faculty.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <FacultyAvatar faculty={faculty} />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{faculty.name}</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {faculty.email}
                    </CardDescription>
                  </div>
                  <Badge variant={getAvailabilityBadgeVariant(faculty.availability)}>
                    {faculty.availability}
                  </Badge>
                </div>
                {faculty.status && (
                  <p className="text-muted-foreground text-xs mt-2 italic">
                    "{faculty.status}"
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No {showOccupied ? "occupied" : "free"} slots on {selectedDay}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className={cn(
                      "text-sm font-medium",
                      showOccupied ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    )}>
                      {showOccupied ? "Occupied" : "Free"} Slots ({slots.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map(slot => (
                        <Badge
                          key={slot.id}
                          variant={showOccupied ? "outline" : "secondary"}
                          className={cn(
                            "text-xs",
                            !showOccupied && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          )}
                        >
                          {showOccupied
                            ? formatSlotBadge(slot, false)
                            : `${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`
                          }
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function SlotWiseFacultyView({ data }: { data: SlotWithFreeFaculty[] }) {
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>(getTodayDayOfWeek)

  const slotsForDay = data.filter(s => s.day === selectedDay)

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => (
          <Button
            key={day}
            variant={selectedDay === day ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDay(day)}
          >
            {DAY_ABBREV[day]}
          </Button>
        ))}
      </div>

      {slotsForDay.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No slots scheduled for {selectedDay}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slotsForDay.map((slot, idx) => (
            <Card key={`${slot.day}-${slot.startTime}-${idx}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Free Faculty */}
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    Free Faculty ({slot.freeFaculty.length})
                  </p>
                  {slot.freeFaculty.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No faculty available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slot.freeFaculty.map(faculty => (
                        <div key={faculty.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                          <FacultyAvatar faculty={faculty} size="sm" />
                          <span className="text-sm">{faculty.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Busy Faculty */}
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Busy Faculty ({slot.busyFaculty.length})
                  </p>
                  {slot.busyFaculty.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No faculty occupied</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slot.busyFaculty.map(faculty => (
                        <div key={faculty.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1 opacity-60">
                          <FacultyAvatar faculty={faculty} size="sm" />
                          <span className="text-sm">{faculty.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }
    </div >
  )
}

function RoomWiseView({ data }: { data: RoomWithSlots[] }) {
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>(getTodayDayOfWeek)
  const [showOccupied, setShowOccupied] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredData = data
    .filter(room =>
      room.number.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(room => ({
      ...room,
      occupiedSlots: room.occupiedSlots.filter(s => s.day === selectedDay),
      freeSlots: room.freeSlots.filter(s => s.day === selectedDay)
    }))

  // Helper to format slot badge text for rooms
  const formatRoomSlotBadge = (slot: RoomWithSlots["occupiedSlots"][0], showDay: boolean) => {
    const parts: string[] = []
    if (showDay) parts.push(DAY_ABBREV[slot.day])
    parts.push(`${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`)
    if (slot.subjectShortName) parts.push(slot.subjectShortName)
    if (slot.batchName) parts.push(`B:${slot.batchName}`)
    return parts.join(" · ")
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search rooms by number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Day filter */}
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(day)}
            >
              {DAY_ABBREV[day]}
            </Button>
          ))}
        </div>

        {/* Free/Occupied toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="room-slot-toggle" className={cn("text-sm", !showOccupied && "text-green-600 dark:text-green-400 font-medium")}>
            Free
          </Label>
          <Switch
            id="room-slot-toggle"
            checked={showOccupied}
            onCheckedChange={setShowOccupied}
          />
          <Label htmlFor="room-slot-toggle" className={cn("text-sm", showOccupied && "text-red-600 dark:text-red-400 font-medium")}>
            Occupied
          </Label>
        </div>
      </div>

      {/* Room cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map(room => {
          const slots = showOccupied ? room.occupiedSlots : room.freeSlots

          return (
            <Card key={room.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                    <DoorOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Room {room.number}</CardTitle>
                    <CardDescription className="text-xs">
                      {room.freeSlots.length} free · {room.occupiedSlots.length} occupied
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No {showOccupied ? "occupied" : "free"} slots on {selectedDay}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className={cn(
                      "text-sm font-medium",
                      showOccupied ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    )}>
                      {showOccupied ? "Occupied" : "Free"} Slots ({slots.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map(slot => (
                        <Badge
                          key={slot.id}
                          variant={showOccupied ? "outline" : "secondary"}
                          className={cn(
                            "text-xs",
                            !showOccupied && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          )}
                        >
                          {showOccupied
                            ? formatRoomSlotBadge(slot, false)
                            : `${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`
                          }
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function SlotWiseRoomView({ data }: { data: SlotWithFreeRooms[] }) {
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>(getTodayDayOfWeek)

  const slotsForDay = data.filter(s => s.day === selectedDay)

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => (
          <Button
            key={day}
            variant={selectedDay === day ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDay(day)}
          >
            {DAY_ABBREV[day]}
          </Button>
        ))}
      </div>

      {slotsForDay.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No slots scheduled for {selectedDay}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slotsForDay.map((slot, idx) => (
            <Card key={`${slot.day}-${slot.startTime}-${idx}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Free Rooms */}
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    Free Rooms ({slot.freeRooms.length})
                  </p>
                  {slot.freeRooms.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No rooms available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slot.freeRooms.map(room => (
                        <Badge key={room.id} variant="secondary" className="gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {room.number}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Occupied Rooms */}
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Occupied Rooms ({slot.occupiedRooms.length})
                  </p>
                  {slot.occupiedRooms.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No rooms occupied</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slot.occupiedRooms.map(room => (
                        <Badge key={room.id} variant="outline" className="gap-1 opacity-60">
                          <DoorOpen className="h-3 w-3" />
                          {room.number}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }
    </div >
  )
}

export function AvailabilityClient({ facultyData, roomData }: AvailabilityClientProps) {
  const [facultyView, setFacultyView] = React.useState<ViewMode>("entity")
  const [roomView, setRoomView] = React.useState<ViewMode>("entity")

  return (
    <Tabs defaultValue="faculty" className="space-y-4">
      <TabsList>
        <TabsTrigger value="faculty" className="gap-2">
          <Users className="h-4 w-4" />
          Faculty
        </TabsTrigger>
        <TabsTrigger value="rooms" className="gap-2">
          <DoorOpen className="h-4 w-4" />
          Rooms
        </TabsTrigger>
      </TabsList>

      <TabsContent value="faculty" className="space-y-4">
        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={facultyView === "entity" ? "default" : "outline"}
            size="sm"
            onClick={() => setFacultyView("entity")}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            By Faculty
          </Button>
          <Button
            variant={facultyView === "slot" ? "default" : "outline"}
            size="sm"
            onClick={() => setFacultyView("slot")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            By Slot
          </Button>
        </div>

        {facultyView === "entity" ? (
          <FacultyWiseView data={facultyData.facultyWise} />
        ) : (
          <SlotWiseFacultyView data={facultyData.slotWise} />
        )}
      </TabsContent>

      <TabsContent value="rooms" className="space-y-4">
        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={roomView === "entity" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoomView("entity")}
            className="gap-2"
          >
            <DoorOpen className="h-4 w-4" />
            By Room
          </Button>
          <Button
            variant={roomView === "slot" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoomView("slot")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            By Slot
          </Button>
        </div>

        {roomView === "entity" ? (
          <RoomWiseView data={roomData.roomWise} />
        ) : (
          <SlotWiseRoomView data={roomData.slotWise} />
        )}
      </TabsContent>
    </Tabs>
  )
}
