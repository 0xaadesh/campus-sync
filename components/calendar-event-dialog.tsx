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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { addCalendarEvent, updateCalendarEvent } from "@/app/actions/calendars"
import { getEventTypes } from "@/app/actions/event-types"

interface EventTypeData {
  id: string
  name: string
  description: string | null
}

interface CalendarEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendarId: string
  initialDate?: Date
  initialData?: {
    id: string
    title: string
    description: string | null
    startDate: string
    endDate?: string
    eventTypeId: string
  }
  onSuccess?: () => void
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  calendarId,
  initialDate,
  initialData,
  onSuccess,
}: CalendarEventDialogProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [eventTypeId, setEventTypeId] = React.useState<string>("")
  const [eventTypes, setEventTypes] = React.useState<EventTypeData[]>([])
  const [loadingTypes, setLoadingTypes] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    title?: string
    startDate?: string
    endDate?: string
    eventType?: string
  }>({})
  const titleInputRef = React.useRef<HTMLInputElement>(null)
  
  const isEdit = !!initialData

  // Helper to format date to YYYY-MM-DD using local time (not UTC)
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Load event types when dialog opens
  React.useEffect(() => {
    if (open) {
      setLoadingTypes(true)
      getEventTypes()
        .then((types: EventTypeData[]) => {
          setEventTypes(types)
          // Set default event type if not editing
          if (!initialData && types.length > 0) {
            // Try to find "Event" type as default, otherwise use first
            const defaultType = types.find((t: EventTypeData) => t.name === "Event") || types[0]
            setEventTypeId(defaultType.id)
          }
        })
        .finally(() => setLoadingTypes(false))
    }
  }, [open, initialData])

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title)
        setDescription(initialData.description ?? "")
        setStartDate(initialData.startDate)
        setEndDate(initialData.endDate ?? "")
        setEventTypeId(initialData.eventTypeId)
      } else {
        setTitle("")
        setDescription("")
        setStartDate(initialDate ? formatDateToLocal(initialDate) : formatDateToLocal(new Date()))
        setEndDate("")
        // eventTypeId is set in the loadEventTypes effect
      }
      setErrors({})
      setIsSubmitting(false)
      setTimeout(() => titleInputRef.current?.focus(), 50)
    }
  }, [open, initialData, initialDate])

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      newErrors.title = "Event title is required"
    } else if (trimmedTitle.length > 200) {
      newErrors.title = "Event title must be 200 characters or less"
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required"
    }

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = "End date must be after start date"
    }

    if (!eventTypeId) {
      newErrors.eventType = "Event type is required"
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
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        eventTypeId,
      }

      const result = isEdit 
        ? await updateCalendarEvent(initialData.id, data)
        : await addCalendarEvent(calendarId, data)

      if (result.error) {
        setErrors({ title: result.error })
        setIsSubmitting(false)
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } catch {
      setErrors({ title: "An unexpected error occurred. Please try again." })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the event details below."
              : "Add a new event to the calendar."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  ref={titleInputRef}
                  id="event-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                  }}
                  placeholder="e.g., Mid-term Exam"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.title}
                />
              </FieldContent>
              {errors.title && <FieldError>{errors.title}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="event-type">Event Type</FieldLabel>
              <FieldContent>
                {loadingTypes ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground border rounded-md">
                    <Spinner size="sm" />
                    Loading event types...
                  </div>
                ) : eventTypes.length === 0 ? (
                  <div className="h-10 px-3 py-2 text-sm text-muted-foreground border rounded-md">
                    No event types available. Please create one first.
                  </div>
                ) : (
                  <Select
                    value={eventTypeId}
                    onValueChange={(value) => {
                      setEventTypeId(value)
                      if (errors.eventType) setErrors((prev) => ({ ...prev, eventType: undefined }))
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="event-type">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FieldContent>
              {errors.eventType && <FieldError>{errors.eventType}</FieldError>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="event-start-date">Start Date</FieldLabel>
                <FieldContent>
                  <Input
                    id="event-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }))
                    }}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.startDate}
                  />
                </FieldContent>
                {errors.startDate && <FieldError>{errors.startDate}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="event-end-date">End Date (Optional)</FieldLabel>
                <FieldContent>
                  <Input
                    id="event-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }))
                    }}
                    disabled={isSubmitting}
                    min={startDate}
                    aria-invalid={!!errors.endDate}
                  />
                </FieldContent>
                {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="event-description">Description (Optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this event..."
                  disabled={isSubmitting}
                  rows={3}
                />
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
            <Button type="submit" disabled={isSubmitting || eventTypes.length === 0}>
              {isSubmitting && <Spinner className="mr-2" />}
              {isEdit ? "Save Changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
