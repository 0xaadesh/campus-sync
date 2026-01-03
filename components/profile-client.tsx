"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Pencil, Check } from "lucide-react"
import { updateUserName, updateUserAvailability, updateUserStatus } from "@/app/actions/auth"
import { updateSlotTypePreference, updateBatchPreferences } from "@/app/actions/preferences"
import type { StudentPreferences } from "@/app/actions/preferences"
import { cn } from "@/lib/utils"

type Availability = "Active" | "Away" | "Busy"

interface ProfileClientProps {
  user: {
    name: string | null
    email: string
    role: string
    availability: Availability
    status: string | null
  }
  preferences: StudentPreferences | null
}

export function ProfileClient({ user, preferences }: ProfileClientProps) {
  const router = useRouter()
  
  // Name edit state
  const [nameDialogOpen, setNameDialogOpen] = React.useState(false)
  const [name, setName] = React.useState(user.name || "")
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [isSubmittingName, setIsSubmittingName] = React.useState(false)
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  // Status edit state
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)
  const [status, setStatus] = React.useState(user.status || "")
  const [statusError, setStatusError] = React.useState<string | null>(null)
  const [isSubmittingStatus, setIsSubmittingStatus] = React.useState(false)
  const statusInputRef = React.useRef<HTMLInputElement>(null)

  // Availability state
  const [availability, setAvailability] = React.useState<Availability>(user.availability)
  const [isUpdatingAvailability, setIsUpdatingAvailability] = React.useState(false)

  // Slot type preferences state
  const [slotTypeStates, setSlotTypeStates] = React.useState<Record<string, boolean>>(() => {
    if (!preferences) return {}
    return Object.fromEntries(preferences.slotTypes.map(st => [st.id, st.enabled]))
  })
  const [updatingSlotTypes, setUpdatingSlotTypes] = React.useState<Set<string>>(new Set())

  // Batch preferences state
  const [selectedBatches, setSelectedBatches] = React.useState<Set<string>>(() => {
    if (!preferences) return new Set()
    return new Set(preferences.batches.filter(b => b.selected).map(b => b.id))
  })
  const [isUpdatingBatches, setIsUpdatingBatches] = React.useState(false)

  React.useEffect(() => {
    if (nameDialogOpen) {
      setName(user.name || "")
      setNameError(null)
      setIsSubmittingName(false)
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [nameDialogOpen, user.name])

  React.useEffect(() => {
    if (statusDialogOpen) {
      setStatus(user.status || "")
      setStatusError(null)
      setIsSubmittingStatus(false)
      setTimeout(() => statusInputRef.current?.focus(), 50)
    }
  }, [statusDialogOpen, user.status])

  const handleNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmittingName) return

    const trimmed = name.trim()

    if (!trimmed) {
      setNameError("Name is required")
      return
    }

    if (trimmed.length > 100) {
      setNameError("Name must be 100 characters or less")
      return
    }

    setIsSubmittingName(true)
    setNameError(null)

    try {
      const result = await updateUserName(trimmed)

      if (result.error) {
        setNameError(result.error)
        setIsSubmittingName(false)
        return
      }

      setNameDialogOpen(false)
      router.refresh()
    } catch {
      setNameError("An unexpected error occurred")
      setIsSubmittingName(false)
    }
  }

  const handleStatusSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmittingStatus) return

    const trimmed = status.trim()

    if (trimmed.length > 100) {
      setStatusError("Status must be 100 characters or less")
      return
    }

    setIsSubmittingStatus(true)
    setStatusError(null)

    try {
      const result = await updateUserStatus(trimmed)

      if (result.error) {
        setStatusError(result.error)
        setIsSubmittingStatus(false)
        return
      }

      setStatusDialogOpen(false)
      router.refresh()
    } catch {
      setStatusError("An unexpected error occurred")
      setIsSubmittingStatus(false)
    }
  }

  const handleAvailabilityChange = async (newAvailability: Availability) => {
    if (isUpdatingAvailability || newAvailability === availability) return

    setIsUpdatingAvailability(true)
    setAvailability(newAvailability)

    try {
      const result = await updateUserAvailability(newAvailability)
      if (result.error) {
        // Revert on error
        setAvailability(user.availability)
      } else {
        router.refresh()
      }
    } catch {
      setAvailability(user.availability)
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  const getAvailabilityColor = (av: Availability) => {
    switch (av) {
      case "Active": return "bg-green-500"
      case "Away": return "bg-red-500"
      case "Busy": return "bg-yellow-500"
    }
  }

  const handleSlotTypeToggle = async (slotTypeId: string, enabled: boolean) => {
    if (updatingSlotTypes.has(slotTypeId)) return

    setUpdatingSlotTypes(prev => new Set(prev).add(slotTypeId))
    setSlotTypeStates(prev => ({ ...prev, [slotTypeId]: enabled }))

    try {
      const result = await updateSlotTypePreference(slotTypeId, enabled)
      if (result.error) {
        // Revert on error
        setSlotTypeStates(prev => ({ ...prev, [slotTypeId]: !enabled }))
      } else {
        router.refresh()
      }
    } catch {
      setSlotTypeStates(prev => ({ ...prev, [slotTypeId]: !enabled }))
    } finally {
      setUpdatingSlotTypes(prev => {
        const next = new Set(prev)
        next.delete(slotTypeId)
        return next
      })
    }
  }

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatches(prev => {
      const next = new Set(prev)
      if (next.has(batchId)) {
        next.delete(batchId)
      } else {
        next.add(batchId)
      }
      return next
    })
  }

  const handleSaveBatches = async () => {
    if (isUpdatingBatches) return

    setIsUpdatingBatches(true)

    try {
      const result = await updateBatchPreferences(Array.from(selectedBatches))
      if (!result.error) {
        router.refresh()
      }
    } catch {
      // Error handling
    } finally {
      setIsUpdatingBatches(false)
    }
  }

  // Check if batch selection has changed from initial
  const batchesChanged = React.useMemo(() => {
    if (!preferences) return false
    const initial = new Set(preferences.batches.filter(b => b.selected).map(b => b.id))
    if (initial.size !== selectedBatches.size) return true
    for (const id of selectedBatches) {
      if (!initial.has(id)) return true
    }
    return false
  }, [preferences, selectedBatches])

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground text-sm">
            View and manage your profile information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your account details and role information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{user.name || "Not set"}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setNameDialogOpen(true)}
                    aria-label="Edit name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-sm">{user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Role
                </label>
                <div>
                  <Badge variant="default">{user.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability & Status</CardTitle>
              <CardDescription>
                Let others know your current availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Availability
                </label>
                <div className="flex gap-2">
                  {(["Active", "Away", "Busy"] as Availability[]).map((av) => (
                    <Button
                      key={av}
                      variant={availability === av ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAvailabilityChange(av)}
                      disabled={isUpdatingAvailability}
                      className="flex items-center gap-2"
                    >
                      <span className={cn("h-2 w-2 rounded-full", getAvailabilityColor(av))} />
                      {av}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{user.status || "No status set"}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setStatusDialogOpen(true)}
                    aria-label="Edit status"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Preferences - Slot Types */}
          {preferences && preferences.slotTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Preferences</CardTitle>
                <CardDescription>
                  Choose which slot types to show on your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {preferences.slotTypes.map((slotType) => (
                  <div key={slotType.id} className="flex items-center justify-between">
                    <Label htmlFor={`slot-type-${slotType.id}`} className="text-sm">
                      {slotType.name}
                    </Label>
                    <Switch
                      id={`slot-type-${slotType.id}`}
                      checked={slotTypeStates[slotType.id] ?? true}
                      onCheckedChange={(checked) => handleSlotTypeToggle(slotType.id, checked)}
                      disabled={updatingSlotTypes.has(slotType.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Student Preferences - Batches */}
          {preferences && preferences.batches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Selection</CardTitle>
                <CardDescription>
                  Select the batches you belong to. Only schedules for selected batches will appear on your dashboard.
                  {selectedBatches.size === 0 && (
                    <span className="block mt-1 text-xs text-muted-foreground/70">
                      No batches selected — showing all schedules
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {preferences.batches.map((batch) => (
                    <Button
                      key={batch.id}
                      variant={selectedBatches.has(batch.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleBatchToggle(batch.id)}
                      className="flex items-center gap-1"
                    >
                      {selectedBatches.has(batch.id) && <Check className="h-3 w-3" />}
                      {batch.name}
                    </Button>
                  ))}
                </div>
                
                {batchesChanged && (
                  <Button 
                    onClick={handleSaveBatches} 
                    disabled={isUpdatingBatches}
                    className="w-full"
                  >
                    {isUpdatingBatches && <Spinner size="sm" className="mr-2" />}
                    Save Batch Selection
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Name Edit Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
            <DialogDescription>
              Update your display name
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleNameSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-name">Name</FieldLabel>
                <FieldContent>
                  <Input
                    ref={nameInputRef}
                    id="edit-name"
                    name="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (nameError) setNameError(null)
                    }}
                    placeholder="Your name"
                    maxLength={100}
                    disabled={isSubmittingName}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? "name-error" : undefined}
                    autoComplete="name"
                  />
                </FieldContent>
                {nameError && <FieldError id="name-error">{nameError}</FieldError>}
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNameDialogOpen(false)}
                disabled={isSubmittingName}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingName}>
                {isSubmittingName && <Spinner size="sm" className="mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Edit Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Set a custom status message
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStatusSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-status">Status</FieldLabel>
                <FieldContent>
                  <Input
                    ref={statusInputRef}
                    id="edit-status"
                    name="status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      if (statusError) setStatusError(null)
                    }}
                    placeholder="What's on your mind?"
                    maxLength={100}
                    disabled={isSubmittingStatus}
                    aria-invalid={!!statusError}
                    aria-describedby={statusError ? "status-error" : undefined}
                  />
                </FieldContent>
                {statusError && <FieldError id="status-error">{statusError}</FieldError>}
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                disabled={isSubmittingStatus}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingStatus}>
                {isSubmittingStatus && <Spinner size="sm" className="mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
