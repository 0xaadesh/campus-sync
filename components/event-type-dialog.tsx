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
import { createEventType, updateEventType } from "@/app/actions/event-types"

interface EventTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: { id: string; name: string }
  onSuccess?: () => void
}

export function EventTypeDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: EventTypeDialogProps) {
  const [name, setName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const isEdit = !!initialData

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "")
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
      setError("Event type name is required")
      return
    }
    if (trimmed.length > 50) {
      setError("Event type name must be 50 characters or less")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set("name", trimmed)
      if (initialData?.id) {
        formData.set("id", initialData.id)
      }

      const result = isEdit 
        ? await updateEventType(null, formData)
        : await createEventType(null, formData)

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
          <DialogTitle>{isEdit ? "Edit Event Type" : "Add Event Type"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the event type details" : "Create a new event type for calendar events"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-type-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  ref={inputRef}
                  id="event-type-name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="e.g., Holiday, Exam, Academic"
                  maxLength={50}
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                  aria-describedby={error ? "event-type-error" : undefined}
                  autoComplete="off"
                />
              </FieldContent>
              {error && (
                <FieldError id="event-type-error" role="alert">
                  {error}
                </FieldError>
              )}
            </Field>
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
