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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Clock, MapPin, User, BookOpen, Layers, FileText, StickyNote, Trash2 } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { createOrUpdateLectureSummary, deleteLectureSummary } from "@/app/actions/lecture-summaries"
import ReactMarkdown from "react-markdown"

interface LectureSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: {
    id: string
    subjectName: string | null
    subjectShortName: string | null
    slotTypeName: string
    startTime: string
    endTime: string
    roomNumber: string | null
    facultyName: string | null
    facultyId: string | null
    batchName: string | null
    summary: {
      id: string
      content: string
      notes: string | null
      createdAt: Date
      updatedAt: Date
    } | null
  }
  selectedDate: string // ISO date string YYYY-MM-DD
  canEdit: boolean
  onSaved?: () => void
}

export function LectureSummaryDialog({
  open,
  onOpenChange,
  slot,
  selectedDate,
  canEdit,
  onSaved
}: LectureSummaryDialogProps) {
  const [content, setContent] = React.useState(slot.summary?.content || "")
  const [notes, setNotes] = React.useState(slot.summary?.notes || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<string>("edit")

  // Reset form when slot changes
  React.useEffect(() => {
    setContent(slot.summary?.content || "")
    setNotes(slot.summary?.notes || "")
    setError(null)
    setActiveTab(canEdit ? "edit" : "preview")
  }, [slot, canEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError("Summary content is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createOrUpdateLectureSummary(
        slot.id,
        selectedDate,
        content.trim(),
        notes.trim() || undefined
      )

      if (result.success) {
        onOpenChange(false)
        onSaved?.()
      } else {
        setError(result.error || "Failed to save summary")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!slot.summary?.id) return
    
    if (!confirm("Are you sure you want to delete this summary?")) return

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteLectureSummary(slot.summary.id)

      if (result.success) {
        onOpenChange(false)
        onSaved?.()
      } else {
        setError(result.error || "Failed to delete summary")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {canEdit ? (slot.summary ? "Edit Lecture Summary" : "Add Lecture Summary") : "View Lecture Summary"}
          </DialogTitle>
          <DialogDescription>
            {slot.subjectName || slot.slotTypeName} - {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Slot Info */}
        <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="shrink-0">
              {slot.slotTypeName}
            </Badge>
            {slot.batchName && (
              <Badge variant="secondary" className="shrink-0">
                <Layers className="h-3 w-3 mr-1" />
                {slot.batchName}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
              <Clock className="h-4 w-4" />
              <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {slot.subjectName && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{slot.subjectName}</span>
              </div>
            )}
            {slot.roomNumber && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Room {slot.roomNumber}</span>
              </div>
            )}
            {slot.facultyName && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{slot.facultyName}</span>
              </div>
            )}
          </div>
        </div>

        {canEdit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summary (Markdown)
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your lecture summary in Markdown format...

# Topics Covered
- Topic 1
- Topic 2

## Key Points
Important concepts discussed...

## Examples
Code examples or demonstrations..."
                    className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Additional Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add links, resources, or additional notes...

Example:
- Reference: https://example.com/docs
- Assignment due: Next Monday
- Related reading: Chapter 5"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 min-h-[200px]">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Summary Preview
                    </h4>
                    {content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No summary content yet...</p>
                    )}
                  </div>
                  
                  {notes && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Additional Notes
                      </h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {notes}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {slot.summary && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="mr-auto"
                >
                  {isDeleting ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                {slot.summary ? "Update Summary" : "Save Summary"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {slot.summary ? (
              <>
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summary
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{slot.summary.content}</ReactMarkdown>
                  </div>
                </div>
                
                {slot.summary.notes && (
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Additional Notes
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {slot.summary.notes}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(slot.summary.updatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No summary available for this lecture yet.</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
