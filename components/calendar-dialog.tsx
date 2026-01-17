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
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { createCalendar, updateCalendar } from "@/app/actions/calendars"

interface CalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: { id: string; name: string; description: string | null }
  onSuccess?: () => void
}

export function CalendarDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: CalendarDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ name?: string; description?: string }>({})
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  
  const isEdit = !!initialData

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "")
      setDescription(initialData?.description ?? "")
      setErrors({})
      setIsSubmitting(false)
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [open, initialData])

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    const trimmedName = name.trim()

    if (!trimmedName) {
      newErrors.name = "Calendar name is required"
    } else if (trimmedName.length > 100) {
      newErrors.name = "Calendar name must be 100 characters or less"
    }

    if (description.trim().length > 500) {
      newErrors.description = "Description must be 500 characters or less"
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
        name: name.trim(),
        description: description.trim() || undefined
      }

      const result = isEdit 
        ? await updateCalendar(initialData.id, data)
        : await createCalendar(data)

      if (result.error) {
        setErrors({ name: result.error })
        setIsSubmitting(false)
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } catch {
      setErrors({ name: "An unexpected error occurred. Please try again." })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Calendar" : "Create Calendar"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the calendar details below."
              : "Create a new calendar. You can add events after creating it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="calendar-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  ref={nameInputRef}
                  id="calendar-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="e.g., Academic Calendar 2026"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.name}
                />
              </FieldContent>
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="calendar-description">Description (Optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  id="calendar-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
                  }}
                  placeholder="Add a description for this calendar..."
                  disabled={isSubmitting}
                  aria-invalid={!!errors.description}
                  rows={3}
                />
              </FieldContent>
              {errors.description && <FieldError>{errors.description}</FieldError>}
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
              {isEdit ? "Save Changes" : "Create Calendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
