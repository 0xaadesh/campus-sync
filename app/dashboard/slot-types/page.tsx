"use client"

import * as React from "react"
import { getSlotTypes, deleteSlotType } from "@/app/actions/slot-types"
import { SlotTypeDialog } from "@/components/slot-type-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

interface SlotType {
  id: string
  name: string
  isBreak: boolean
  requiresSubject: boolean
  requiresRoom: boolean
  requiresFaculty: boolean
}

function requirementSummary(slotType: SlotType): string {
  if (slotType.isBreak) return "No subject, room or faculty"
  const required = [
    slotType.requiresSubject && "subject",
    slotType.requiresRoom && "room",
    slotType.requiresFaculty && "faculty",
  ].filter(Boolean)
  return required.length > 0
    ? "Requires " + required.join(", ")
    : "Subject, room and faculty all optional"
}

function SlotTypesList({
  slotTypes,
  onEdit,
  onDelete,
  deletingId,
}: {
  slotTypes: SlotType[]
  onEdit: (slotType: SlotType) => void
  onDelete: (slotType: SlotType) => void
  deletingId: string | null
}) {
  if (slotTypes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No slot types found. Click "Add Slot Type" to create one.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {slotTypes.map((slotType) => (
        <Card key={slotType.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{slotType.name}</span>
                {slotType.isBreak && <Badge variant="secondary">Break</Badge>}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {requirementSummary(slotType)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(slotType)}
                disabled={!!deletingId}
                aria-label="Edit slot type"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(slotType)}
                disabled={deletingId === slotType.id}
                aria-label="Delete slot type"
              >
                {deletingId === slotType.id ? (
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

export default function SlotTypesPage() {
  const [slotTypes, setSlotTypes] = React.useState<SlotType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingSlotType, setEditingSlotType] = React.useState<SlotType | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [slotTypeToDelete, setSlotTypeToDelete] = React.useState<SlotType | null>(null)

  const loadSlotTypes = React.useCallback(async () => {
    try {
      const data = await getSlotTypes()
      setSlotTypes(data)
    } catch (error) {
      console.error("Failed to load slot types:", error)
    }
  }, [])

  React.useEffect(() => {
    loadSlotTypes().finally(() => setLoading(false))
  }, [loadSlotTypes])

  const handleAdd = () => {
    setEditingSlotType(null)
    setDialogOpen(true)
  }

  const handleEdit = (slotType: SlotType) => {
    setEditingSlotType(slotType)
    setDialogOpen(true)
  }

  const handleDeleteClick = (slotType: SlotType) => {
    setSlotTypeToDelete(slotType)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!slotTypeToDelete) return

    const id = slotTypeToDelete.id
    setDeletingId(id)
    setDeleteDialogOpen(false)

    const result = await deleteSlotType(id)
    if (result.success) {
      setSlotTypes((prev) => prev.filter((s) => s.id !== id))
    } else {
      await loadSlotTypes()
    }
    setDeletingId(null)
    setSlotTypeToDelete(null)
  }

  const handleDialogSuccess = () => {
    loadSlotTypes()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-24" />
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
          <h1 className="text-2xl font-bold">Slot Types</h1>
          <p className="text-muted-foreground text-sm">Manage slot types</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slot Type
        </Button>
      </div>

      <SlotTypesList
        slotTypes={slotTypes}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        deletingId={deletingId}
      />

      <SlotTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingSlotType ?? undefined}
        onSuccess={handleDialogSuccess}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Slot Type"
        description="Are you sure you want to delete this slot type? This action cannot be undone."
        itemName={slotTypeToDelete?.name}
        isDeleting={!!deletingId}
      />
    </div>
  )
}

