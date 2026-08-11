"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { addTimeSlot, updateTimeSlot, type DayOfWeek, type TimeSlotData } from "@/app/actions/timetables"

type Subject = { id: string; name: string; shortName: string }
type SlotType = {
  id: string
  name: string
  isBreak: boolean
  requiresSubject: boolean
  requiresRoom: boolean
  requiresFaculty: boolean
}
type Room = { id: string; number: string }
type Faculty = { id: string; name: string; email: string }
type Batch = { id: string; name: string }

interface TimeSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timetableId: string
  day: DayOfWeek
  initialData?: {
    id: string
    day: DayOfWeek
    startTime: string
    endTime: string
    subject: Subject | null
    slotType: SlotType
    room: Room | null
    faculty: { id: string; name: string } | null
    batch: Batch | null
  }
  subjects: Subject[]
  slotTypes: SlotType[]
  rooms: Room[]
  faculty: Faculty[]
  batches: Batch[]
  onSuccess?: () => void
}

export function TimeSlotDialog({
  open,
  onOpenChange,
  timetableId,
  day,
  initialData,
  subjects,
  slotTypes,
  rooms,
  faculty,
  batches,
  onSuccess,
}: TimeSlotDialogProps) {
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState("")
  const [selectedSlotType, setSelectedSlotType] = React.useState("")
  const [selectedRoom, setSelectedRoom] = React.useState("")
  const [selectedFaculty, setSelectedFaculty] = React.useState("")
  const [selectedBatch, setSelectedBatch] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Popover states
  const [subjectOpen, setSubjectOpen] = React.useState(false)
  const [slotTypeOpen, setSlotTypeOpen] = React.useState(false)
  const [roomOpen, setRoomOpen] = React.useState(false)
  const [facultyOpen, setFacultyOpen] = React.useState(false)
  const [batchOpen, setBatchOpen] = React.useState(false)

  const isEdit = !!initialData

  // What a slot may and must carry is defined on the slot type itself
  const activeSlotType = React.useMemo(
    () => slotTypes.find((s) => s.id === selectedSlotType) ?? null,
    [selectedSlotType, slotTypes]
  )

  const isBreakSlot = activeSlotType?.isBreak ?? false
  const requiresSubject = !isBreakSlot && (activeSlotType?.requiresSubject ?? false)
  const requiresRoom = !isBreakSlot && (activeSlotType?.requiresRoom ?? false)
  const requiresFaculty = !isBreakSlot && (activeSlotType?.requiresFaculty ?? false)

  // Clear other fields when switching to break
  React.useEffect(() => {
    if (isBreakSlot) {
      setSelectedSubject("")
      setSelectedRoom("")
      setSelectedFaculty("")
    }
  }, [isBreakSlot])

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setStartTime(initialData.startTime)
        setEndTime(initialData.endTime)
        setSelectedSubject(initialData.subject?.id || "")
        setSelectedSlotType(initialData.slotType.id)
        setSelectedRoom(initialData.room?.id || "")
        setSelectedFaculty(initialData.faculty?.id || "")
        setSelectedBatch(initialData.batch?.id || "")
      } else {
        setStartTime("")
        setEndTime("")
        setSelectedSubject("")
        setSelectedSlotType("")
        setSelectedRoom("")
        setSelectedFaculty("")
        setSelectedBatch("")
      }
      setErrors({})
      setIsSubmitting(false)
    }
  }, [open, initialData])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!startTime) {
      newErrors.startTime = "Start time is required"
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      newErrors.startTime = "Invalid time format (HH:MM)"
    }

    if (!endTime) {
      newErrors.endTime = "End time is required"
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
      newErrors.endTime = "Invalid time format (HH:MM)"
    }

    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = "End time must be after start time"
    }

    if (!selectedSlotType) {
      newErrors.slotType = "Slot type is required"
    }

    // Each field is required only if the selected slot type says so
    if (requiresSubject && !selectedSubject) {
      newErrors.subject = "Subject is required"
    }

    if (requiresRoom && !selectedRoom) {
      newErrors.room = "Room is required"
    }

    if (requiresFaculty && !selectedFaculty) {
      newErrors.faculty = "Faculty is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const data: TimeSlotData = {
        day: isEdit ? initialData.day : day,
        startTime,
        endTime,
        subjectId: isBreakSlot ? undefined : selectedSubject,
        slotTypeId: selectedSlotType,
        roomId: isBreakSlot ? undefined : selectedRoom,
        facultyId: isBreakSlot ? undefined : selectedFaculty,
        batchId: selectedBatch || undefined,
      }

      const result = isEdit
        ? await updateTimeSlot(initialData.id, data)
        : await addTimeSlot(timetableId, data)

      if (result.error) {
        setErrors({ form: result.error })
        setIsSubmitting(false)
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." })
      setIsSubmitting(false)
    }
  }

  // Helper functions to get labels
  const getSubjectLabel = (id: string) => {
    const subject = subjects.find((s) => s.id === id)
    return subject ? `${subject.shortName} - ${subject.name}` : ""
  }

  const getSlotTypeLabel = (id: string) => {
    return slotTypes.find((s) => s.id === id)?.name ?? ""
  }

  const getRoomLabel = (id: string) => {
    return rooms.find((r) => r.id === id)?.number ?? ""
  }

  const getFacultyLabel = (id: string) => {
    return faculty.find((f) => f.id === id)?.name ?? ""
  }

  const getBatchLabel = (id: string) => {
    return batches.find((b) => b.id === id)?.name ?? ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Slot" : `Add Slot for ${day}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the time slot details below."
              : `Add a new time slot for ${day}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {errors.form && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.form}
            </div>
          )}
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="slot-start-time">Start Time</FieldLabel>
                <FieldContent>
                  <Input
                    id="slot-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value)
                      if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: "" }))
                    }}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.startTime}
                  />
                </FieldContent>
                {errors.startTime && <FieldError>{errors.startTime}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="slot-end-time">End Time</FieldLabel>
                <FieldContent>
                  <Input
                    id="slot-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value)
                      if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: "" }))
                    }}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.endTime}
                  />
                </FieldContent>
                {errors.endTime && <FieldError>{errors.endTime}</FieldError>}
              </Field>
            </div>

            {/* Subject Combobox */}
            <Field>
              <FieldLabel>
                Subject{" "}
                {isBreakSlot ? (
                  <span className="text-muted-foreground text-xs">(not used for a break)</span>
                ) : (
                  !requiresSubject && <span className="text-muted-foreground text-xs">(optional)</span>
                )}
              </FieldLabel>
              <FieldContent>
                <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting || isBreakSlot}
                    >
                      {selectedSubject ? getSubjectLabel(selectedSubject) : "Select subject..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search subjects..." />
                      <CommandList>
                        <CommandEmpty>No subjects found.</CommandEmpty>
                        <CommandGroup>
                          {subjects.map((subject) => (
                            <CommandItem
                              key={subject.id}
                              value={`${subject.shortName} ${subject.name}`}
                              onSelect={() => {
                                setSelectedSubject(subject.id)
                                setSubjectOpen(false)
                                if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }))
                              }}
                              data-checked={selectedSubject === subject.id}
                            >
                              <span className="font-medium">{subject.shortName}</span>
                              <span className="text-muted-foreground ml-2">{subject.name}</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedSubject === subject.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldContent>
              {errors.subject && <FieldError>{errors.subject}</FieldError>}
            </Field>

            {/* Slot Type Combobox */}
            <Field>
              <FieldLabel>Slot Type</FieldLabel>
              <FieldContent>
                <Popover open={slotTypeOpen} onOpenChange={setSlotTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={slotTypeOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting}
                    >
                      {selectedSlotType ? getSlotTypeLabel(selectedSlotType) : "Select slot type..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search slot types..." />
                      <CommandList>
                        <CommandEmpty>No slot types found.</CommandEmpty>
                        <CommandGroup>
                          {slotTypes.map((st) => (
                            <CommandItem
                              key={st.id}
                              value={st.name}
                              onSelect={() => {
                                setSelectedSlotType(st.id)
                                setSlotTypeOpen(false)
                                if (errors.slotType) setErrors((prev) => ({ ...prev, slotType: "" }))
                              }}
                              data-checked={selectedSlotType === st.id}
                            >
                              {st.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedSlotType === st.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldContent>
              {errors.slotType && <FieldError>{errors.slotType}</FieldError>}
            </Field>

            {/* Room Combobox */}
            <Field>
              <FieldLabel>
                Room{" "}
                {isBreakSlot ? (
                  <span className="text-muted-foreground text-xs">(not used for a break)</span>
                ) : (
                  !requiresRoom && <span className="text-muted-foreground text-xs">(optional)</span>
                )}
              </FieldLabel>
              <FieldContent>
                <Popover open={roomOpen} onOpenChange={setRoomOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roomOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting || isBreakSlot}
                    >
                      {selectedRoom ? getRoomLabel(selectedRoom) : "Select room..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search rooms..." />
                      <CommandList>
                        <CommandEmpty>No rooms found.</CommandEmpty>
                        <CommandGroup>
                          {rooms.map((room) => (
                            <CommandItem
                              key={room.id}
                              value={room.number}
                              onSelect={() => {
                                setSelectedRoom(room.id)
                                setRoomOpen(false)
                                if (errors.room) setErrors((prev) => ({ ...prev, room: "" }))
                              }}
                              data-checked={selectedRoom === room.id}
                            >
                              {room.number}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedRoom === room.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldContent>
              {errors.room && <FieldError>{errors.room}</FieldError>}
            </Field>

            {/* Faculty Combobox */}
            <Field>
              <FieldLabel>
                Faculty{" "}
                {isBreakSlot ? (
                  <span className="text-muted-foreground text-xs">(not used for a break)</span>
                ) : (
                  !requiresFaculty && <span className="text-muted-foreground text-xs">(optional)</span>
                )}
              </FieldLabel>
              <FieldContent>
                <Popover open={facultyOpen} onOpenChange={setFacultyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={facultyOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting || isBreakSlot}
                    >
                      {selectedFaculty ? getFacultyLabel(selectedFaculty) : "Select faculty..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search faculty..." />
                      <CommandList>
                        <CommandEmpty>No faculty found.</CommandEmpty>
                        <CommandGroup>
                          {faculty.map((f) => (
                            <CommandItem
                              key={f.id}
                              value={`${f.name} ${f.email}`}
                              onSelect={() => {
                                setSelectedFaculty(f.id)
                                setFacultyOpen(false)
                                if (errors.faculty) setErrors((prev) => ({ ...prev, faculty: "" }))
                              }}
                              data-checked={selectedFaculty === f.id}
                            >
                              <div className="flex flex-col">
                                <span>{f.name}</span>
                                <span className="text-xs text-muted-foreground">{f.email}</span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedFaculty === f.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldContent>
              {errors.faculty && <FieldError>{errors.faculty}</FieldError>}
            </Field>

            {/* Batch Combobox (Optional) */}
            <Field>
              <FieldLabel>Batch <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <FieldContent>
                <Popover open={batchOpen} onOpenChange={setBatchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={batchOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting}
                    >
                      {selectedBatch ? getBatchLabel(selectedBatch) : "Select batch..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search batches..." />
                      <CommandList>
                        <CommandEmpty>No batches found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__clear__"
                            onSelect={() => {
                              setSelectedBatch("")
                              setBatchOpen(false)
                            }}
                          >
                            <span className="text-muted-foreground">Clear selection</span>
                          </CommandItem>
                          {batches.map((batch) => (
                            <CommandItem
                              key={batch.id}
                              value={batch.name}
                              onSelect={() => {
                                setSelectedBatch(batch.id)
                                setBatchOpen(false)
                              }}
                              data-checked={selectedBatch === batch.id}
                            >
                              {batch.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedBatch === batch.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2" />}
              {isEdit ? "Save Changes" : "Add Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
