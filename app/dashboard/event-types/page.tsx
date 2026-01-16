"use client"

import * as React from "react"
import { getEventTypes, deleteEventType } from "@/app/actions/event-types"
import { EventTypeDialog } from "@/components/event-type-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2, Plus, Tag } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

interface EventType {
  id: string
  name: string
  description: string | null
}

function EventTypesList({
  eventTypes,
  onEdit,
  onDelete,
  deletingId,
}: {
  eventTypes: EventType[]
  onEdit: (eventType: EventType) => void
  onDelete: (eventType: EventType) => void
  deletingId: string | null
}) {
  if (eventTypes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No event types found. Click "Add Event Type" to create one.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {eventTypes.map((eventType) => (
        <Card key={eventType.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{eventType.name}</div>
                {eventType.description && (
                  <div className="text-sm text-muted-foreground">{eventType.description}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(eventType)}
                disabled={!!deletingId}
                aria-label="Edit event type"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(eventType)}
                disabled={deletingId === eventType.id}
                aria-label="Delete event type"
              >
                {deletingId === eventType.id ? (
                  <Spinner size="sm" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = React.useState<EventType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingEventType, setEditingEventType] = React.useState<EventType | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [eventTypeToDelete, setEventTypeToDelete] = React.useState<EventType | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const loadEventTypes = React.useCallback(async () => {
    try {
      const data = await getEventTypes()
      setEventTypes(data)
    } catch (error) {
      console.error("Failed to load event types:", error)
    }
  }, [])

  React.useEffect(() => {
    loadEventTypes().finally(() => setLoading(false))
  }, [loadEventTypes])

  const handleAdd = () => {
    setEditingEventType(null)
    setDialogOpen(true)
  }

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType)
    setDialogOpen(true)
  }

  const handleDeleteClick = (eventType: EventType) => {
    setEventTypeToDelete(eventType)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventTypeToDelete) return

    const id = eventTypeToDelete.id
    setDeletingId(id)
    setDeleteDialogOpen(false)

    const result = await deleteEventType(id)
    if (result.success) {
      setEventTypes((prev) => prev.filter((e) => e.id !== id))
    } else if (result.error) {
      setDeleteError(result.error)
      setDeleteDialogOpen(true)
    }
    setDeletingId(null)
    if (result.success) {
      setEventTypeToDelete(null)
    }
  }

  const handleDialogSuccess = () => {
    loadEventTypes()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Types</h1>
          <p className="text-muted-foreground text-sm">Manage calendar event types</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event Type
        </Button>
      </div>

      <EventTypesList
        eventTypes={eventTypes}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        deletingId={deletingId}
      />

      <EventTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingEventType ?? undefined}
        onSuccess={handleDialogSuccess}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setDeleteError(null)
            setEventTypeToDelete(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Event Type"
        description={deleteError || "Are you sure you want to delete this event type? This action cannot be undone."}
        itemName={eventTypeToDelete?.name}
        isDeleting={!!deletingId}
      />
    </div>
  )
}
