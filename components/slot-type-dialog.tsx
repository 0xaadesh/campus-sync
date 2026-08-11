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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { createSlotType, updateSlotType } from "@/app/actions/slot-types"

interface SlotTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    id: string
    name: string
    isBreak: boolean
    requiresSubject: boolean
    requiresRoom: boolean
    requiresFaculty: boolean
  }
  onSuccess?: () => void
}

export function SlotTypeDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: SlotTypeDialogProps) {
  const [name, setName] = React.useState("")
  const [isBreak, setIsBreak] = React.useState(false)
  const [requiresSubject, setRequiresSubject] = React.useState(true)
  const [requiresRoom, setRequiresRoom] = React.useState(true)
  const [requiresFaculty, setRequiresFaculty] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const isEdit = !!initialData

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "")
      setIsBreak(initialData?.isBreak ?? false)
      setRequiresSubject(initialData?.requiresSubject ?? true)
      setRequiresRoom(initialData?.requiresRoom ?? true)
      setRequiresFaculty(initialData?.requiresFaculty ?? true)
      setError(null)
      setIsSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const trimmed = name.trim()
    
    // Client validation
    if (!trimmed) {
      setError("Slot type name is required")
      return
    }
    if (trimmed.length > 50) {
      setError("Slot type name must be 50 characters or less")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set("name", trimmed)
      formData.set("isBreak", String(isBreak))
      formData.set("requiresSubject", String(requiresSubject))
      formData.set("requiresRoom", String(requiresRoom))
      formData.set("requiresFaculty", String(requiresFaculty))
      if (initialData?.id) {
        formData.set("id", initialData.id)
      }

      const result = isEdit 
        ? await updateSlotType(null, formData)
        : await createSlotType(null, formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Slot Type" : "Add Slot Type"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the slot type name" : "Create a new slot type"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="slot-type-name">Slot Type Name</FieldLabel>
              <FieldContent>
                <Input
                  ref={inputRef}
                  id="slot-type-name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Lecture"
                  maxLength={50}
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                  aria-describedby={error ? "slot-type-error" : undefined}
                  autoComplete="off"
                />
              </FieldContent>
              {error && (
                <FieldError id="slot-type-error" role="alert">
                  {error}
                </FieldError>
              )}
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="slot-type-is-break">Break / non-teaching slot</FieldLabel>
                <FieldDescription>
                  Slots of this type show as a break and are excluded from faculty and room
                  availability. Subject, room and faculty are not required.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="slot-type-is-break"
                checked={isBreak}
                onCheckedChange={setIsBreak}
                disabled={isSubmitting}
              />
            </Field>

            <FieldSeparator />

            <FieldSet disabled={isBreak || isSubmitting}>
              <FieldLegend variant="label">Required fields</FieldLegend>
              <FieldDescription>
                {isBreak
                  ? "A break never carries a subject, room or faculty."
                  : "Turn a field off to make it optional when creating a slot of this type."}
              </FieldDescription>
              <FieldGroup className="gap-3">
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="slot-type-requires-subject">Subject</FieldLabel>
                  <Switch
                    id="slot-type-requires-subject"
                    checked={!isBreak && requiresSubject}
                    onCheckedChange={setRequiresSubject}
                    disabled={isBreak || isSubmitting}
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="slot-type-requires-room">Room</FieldLabel>
                  <Switch
                    id="slot-type-requires-room"
                    checked={!isBreak && requiresRoom}
                    onCheckedChange={setRequiresRoom}
                    disabled={isBreak || isSubmitting}
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="slot-type-requires-faculty">Faculty</FieldLabel>
                  <Switch
                    id="slot-type-requires-faculty"
                    checked={!isBreak && requiresFaculty}
                    onCheckedChange={setRequiresFaculty}
                    disabled={isBreak || isSubmitting}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              {isSubmitting 
                ? (isEdit ? "Updating..." : "Creating...") 
                : (isEdit ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
