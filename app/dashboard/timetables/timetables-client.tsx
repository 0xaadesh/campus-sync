"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
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
import { TimetableDialog } from "@/components/timetable-dialog"
import { TimeSlotDialog } from "@/components/time-slot-dialog"
import { TimetableGroupDialog } from "@/components/timetable-group-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { formatTime } from "@/lib/utils"
import { deleteTimetable, deleteTimeSlot, checkCanEditTimetable, type DayOfWeek } from "@/app/actions/timetables"
import {
  PlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BookOpenIcon,
  UserIcon,
  FileDownIcon,
} from "lucide-react"
import { TimetablePDF } from "@/components/timetable-pdf"
import { pdf } from "@react-pdf/renderer"
import type { TimetableForPDF } from "@/lib/pdf-timetable"

const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type Subject = { id: string; name: string; shortName: string }
type SlotType = { id: string; name: string }
type Room = { id: string; number: string }
type Faculty = { id: string; name: string; email: string }
type Group = { id: string; title: string; defaultRole: string }
type Batch = { id: string; name: string }

type TimeSlot = {
  id: string
  day: DayOfWeek
  startTime: string
  endTime: string
  subject: Subject | null
  slotType: SlotType
  room: { id: string; number: string } | null
  faculty: { id: string; name: string } | null
  batch: Batch | null
}

type Timetable = {
  id: string
  name: string
  description: string | null
  createdById: string
  createdBy: { id: string; name: string }
  createdAt: Date
  slots: TimeSlot[]
  groups: { id: string; group: Group }[]
}

interface TimetablesClientProps {
  timetables: Timetable[]
  subjects: Subject[]
  slotTypes: SlotType[]
  rooms: Room[]
  faculty: Faculty[]
  groups: Group[]
  batches: Batch[]
  isHOD: boolean
  userId: string
}

export function TimetablesClient({
  timetables,
  subjects,
  slotTypes,
  rooms,
  faculty,
  groups,
  batches,
  isHOD,
  userId,
}: TimetablesClientProps) {
  const router = useRouter()
  const [selectedTimetable, setSelectedTimetable] = React.useState<Timetable | null>(
    timetables.length > 0 ? timetables[0] : null
  )
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>("Monday")
  const [canEdit, setCanEdit] = React.useState(isHOD)

  // Dialog states
  const [timetableDialogOpen, setTimetableDialogOpen] = React.useState(false)
  const [editingTimetable, setEditingTimetable] = React.useState<Timetable | null>(null)
  const [slotDialogOpen, setSlotDialogOpen] = React.useState(false)
  const [editingSlot, setEditingSlot] = React.useState<TimeSlot | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingTimetable, setDeletingTimetable] = React.useState<Timetable | null>(null)
  const [deleteSlotDialogOpen, setDeleteSlotDialogOpen] = React.useState(false)
  const [deletingSlot, setDeletingSlot] = React.useState<TimeSlot | null>(null)

  // Check edit permission when timetable changes
  React.useEffect(() => {
    if (selectedTimetable && !isHOD) {
      checkCanEditTimetable(selectedTimetable.id).then(setCanEdit)
    } else if (isHOD) {
      setCanEdit(true)
    }
  }, [selectedTimetable, isHOD])

  // Update selected timetable when timetables change
  React.useEffect(() => {
    if (selectedTimetable) {
      const updated = timetables.find((t) => t.id === selectedTimetable.id)
      if (updated) {
        setSelectedTimetable(updated)
      } else if (timetables.length > 0) {
        setSelectedTimetable(timetables[0])
      } else {
        setSelectedTimetable(null)
      }
    } else if (timetables.length > 0) {
      setSelectedTimetable(timetables[0])
    }
  }, [timetables])

  const handleRefresh = () => {
    router.refresh()
  }

  // Get slots for selected day
  const slotsForDay = selectedTimetable?.slots
    .filter((slot) => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime)) ?? []

  // Handle timetable actions
  const handleCreateTimetable = () => {
    setEditingTimetable(null)
    setTimetableDialogOpen(true)
  }

  const handleEditTimetable = (timetable: Timetable) => {
    setEditingTimetable(timetable)
    setTimetableDialogOpen(true)
  }

  const handleDeleteTimetable = (timetable: Timetable) => {
    setDeletingTimetable(timetable)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTimetable = async () => {
    if (!deletingTimetable) return
    const result = await deleteTimetable(deletingTimetable.id)
    if (!result.error) {
      handleRefresh()
    }
    setDeleteDialogOpen(false)
    setDeletingTimetable(null)
  }

  // Handle slot actions
  const handleAddSlot = () => {
    setEditingSlot(null)
    setSlotDialogOpen(true)
  }

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setSlotDialogOpen(true)
  }

  const handleDeleteSlot = (slot: TimeSlot) => {
    setDeletingSlot(slot)
    setDeleteSlotDialogOpen(true)
  }

  const confirmDeleteSlot = async () => {
    if (!deletingSlot) return
    const result = await deleteTimeSlot(deletingSlot.id)
    if (!result.error) {
      handleRefresh()
    }
    setDeleteSlotDialogOpen(false)
    setDeletingSlot(null)
  }

  // Handle group assignment
  const handleManageGroups = () => {
    setGroupDialogOpen(true)
  }

  // Handle PDF export
  const handleExportPDF = async (timetable: Timetable) => {
    try {
      // Convert Timetable to TimetableForPDF format
      const timetableForPDF: TimetableForPDF = {
        id: timetable.id,
        name: timetable.name,
        description: timetable.description,
        createdBy: timetable.createdBy,
        createdAt: timetable.createdAt,
        slots: timetable.slots.map(slot => ({
          id: slot.id,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          slotType: slot.slotType,
          room: slot.room,
          faculty: slot.faculty,
          batch: slot.batch,
        })),
      }

      // Generate PDF blob
      const blob = await pdf(<TimetablePDF timetable={timetableForPDF} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${timetable.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-timetable.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timetables</h1>
          <p className="text-muted-foreground text-sm">
            {isHOD
              ? "Create and manage timetables for your department."
              : "View your assigned timetables."}
          </p>
        </div>
        {isHOD && (
          <Button onClick={handleCreateTimetable}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Timetable
          </Button>
        )}
      </div>

      {timetables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Timetables</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isHOD
                ? "Create your first timetable to get started."
                : "You don't have any timetables assigned yet."}
            </p>
            {isHOD && (
              <Button onClick={handleCreateTimetable}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Timetable list sidebar */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Timetables</h3>
            {timetables.map((timetable) => (
              <Card
                key={timetable.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${selectedTimetable?.id === timetable.id ? "border-primary bg-accent" : ""
                  }`}
                onClick={() => setSelectedTimetable(timetable)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base truncate" title={timetable.name}>{timetable.name}</CardTitle>
                  {timetable.description && (
                    <CardDescription className="text-xs line-clamp-2">
                      {timetable.description}
                    </CardDescription>
                  )}
                  {isHOD && (
                    <CardAction>
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
                          <DropdownMenuItem onClick={() => handleEditTimetable(timetable)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTimetable(timetable)
                            handleManageGroups()
                          }}>
                            <UsersIcon className="mr-2 h-4 w-4" />
                            Manage Groups
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPDF(timetable)}>
                            <FileDownIcon className="mr-2 h-4 w-4" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteTimetable(timetable)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  )}
                  {isHOD && (
                    <div className="flex gap-1 mt-2 flex-wrap col-span-full">
                      {timetable.groups.slice(0, 2).map((g) => (
                        <Badge key={g.id} variant="outline" className="text-xs">
                          {g.group.title}
                        </Badge>
                      ))}
                      {timetable.groups.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{timetable.groups.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Timetable view */}
          {selectedTimetable && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedTimetable.name}</CardTitle>
                    {selectedTimetable.description && (
                      <CardDescription className="mt-1">
                        {selectedTimetable.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExportPDF(selectedTimetable)}
                    >
                      <FileDownIcon className="mr-2 h-4 w-4" />
                      Export as PDF
                    </Button>
                    {canEdit && (
                      <Button onClick={handleAddSlot}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Slot
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day tabs - sticky */}
                <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDay(day)}
                      className="flex-shrink-0"
                    >
                      {SHORT_DAYS[idx]}
                    </Button>
                  ))}
                </div>

                {/* Scrollable slots container */}
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                  {/* Slots for the day */}
                  {slotsForDay.length === 0 ? (
                    <div className="text-center py-12">
                      <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No slots for {selectedDay}</h3>
                      <p className="text-muted-foreground mb-4">
                        {canEdit
                          ? "Add a slot to this day."
                          : "No classes scheduled for this day."}
                      </p>
                      {canEdit && (
                        <Button onClick={handleAddSlot}>
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Slot
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {slotsForDay.map((slot) => (
                        <Card key={slot.id} className="overflow-hidden">
                          <div className="flex">
                            {/* Time column */}
                            <div className="bg-primary/10 p-4 flex flex-col items-center justify-center min-w-[100px]">
                              <span className="text-sm font-medium">{formatTime(slot.startTime)}</span>
                              <span className="text-xs text-muted-foreground">to</span>
                              <span className="text-sm font-medium">{formatTime(slot.endTime)}</span>
                            </div>
                            {/* Details column */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                                    {slot.subject
                                      ? `${slot.subject.shortName} - ${slot.subject.name}`
                                      : slot.slotType.name}
                                  </h4>
                                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                    {slot.room && (
                                      <span className="flex items-center gap-1">
                                        <MapPinIcon className="h-3 w-3" />
                                        {slot.room.number}
                                      </span>
                                    )}
                                    {slot.faculty && (
                                      <span className="flex items-center gap-1">
                                        <UserIcon className="h-3 w-3" />
                                        {slot.faculty.name}
                                      </span>
                                    )}
                                    {slot.batch && (
                                      <Badge variant="outline" className="text-xs">
                                        {slot.batch.name}
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                      {slot.slotType.name}
                                    </Badge>
                                  </div>
                                </div>
                                {canEdit && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon-xs">
                                        <MoreVerticalIcon className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditSlot(slot)}>
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleDeleteSlot(slot)}
                                      >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogs */}
      <TimetableDialog
        open={timetableDialogOpen}
        onOpenChange={setTimetableDialogOpen}
        initialData={editingTimetable ? {
          id: editingTimetable.id,
          name: editingTimetable.name,
          description: editingTimetable.description
        } : undefined}
        onSuccess={handleRefresh}
      />

      {selectedTimetable && (
        <>
          <TimeSlotDialog
            open={slotDialogOpen}
            onOpenChange={setSlotDialogOpen}
            timetableId={selectedTimetable.id}
            day={selectedDay}
            initialData={editingSlot ?? undefined}
            subjects={subjects}
            slotTypes={slotTypes}
            rooms={rooms}
            faculty={faculty}
            batches={batches}
            onSuccess={handleRefresh}
          />

          {isHOD && (
            <TimetableGroupDialog
              open={groupDialogOpen}
              onOpenChange={setGroupDialogOpen}
              timetableId={selectedTimetable.id}
              timetableName={selectedTimetable.name}
              assignedGroups={selectedTimetable.groups}
              allGroups={groups}
              onSuccess={handleRefresh}
            />
          )}
        </>
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Timetable"
        description={`Are you sure you want to delete "${deletingTimetable?.name}"? This will also delete all slots in this timetable. This action cannot be undone.`}
        onConfirm={confirmDeleteTimetable}
      />

      <DeleteDialog
        open={deleteSlotDialogOpen}
        onOpenChange={setDeleteSlotDialogOpen}
        title="Delete Slot"
        description={`Are you sure you want to delete this slot (${deletingSlot?.subject?.shortName || deletingSlot?.slotType.name} at ${deletingSlot ? formatTime(deletingSlot.startTime) : ''} - ${deletingSlot ? formatTime(deletingSlot.endTime) : ''})? This action cannot be undone.`}
        onConfirm={confirmDeleteSlot}
      />
    </div>
  )
}
