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
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { assignGroupToCalendar, removeGroupFromCalendar } from "@/app/actions/calendars"
import { XIcon, PlusIcon, Check, ChevronsUpDown } from "lucide-react"
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
import { cn } from "@/lib/utils"

type Group = { id: string; title: string; defaultRole: string }
type AssignedGroup = { id: string; group: Group }

interface CalendarGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendarId: string
  calendarName: string
  assignedGroups: AssignedGroup[]
  allGroups: Group[]
  onSuccess?: () => void
}

export function CalendarGroupDialog({
  open,
  onOpenChange,
  calendarId,
  calendarName,
  assignedGroups,
  allGroups,
  onSuccess,
}: CalendarGroupDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>("")
  const [groupPopoverOpen, setGroupPopoverOpen] = React.useState(false)

  // Filter out already assigned groups
  const availableGroups = allGroups.filter(
    (group) => !assignedGroups.some((ag) => ag.group.id === group.id)
  )

  React.useEffect(() => {
    if (open) {
      setError(null)
      setSelectedGroupId("")
      setIsSubmitting(false)
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedGroupId || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await assignGroupToCalendar(calendarId, selectedGroupId)
      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }
      setSelectedGroupId("")
      onSuccess?.()
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (groupId: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await removeGroupFromCalendar(calendarId, groupId)
      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }
      onSuccess?.()
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGroupLabel = (id: string) => {
    return availableGroups.find((g) => g.id === id)?.title ?? ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            Assign groups to "{calendarName}". Members of assigned groups will be able to view or edit this calendar based on their role.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Current assigned groups */}
          <div>
            <h4 className="text-sm font-medium mb-2">Assigned Groups</h4>
            {assignedGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedGroups.map((ag) => (
                  <Badge
                    key={ag.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {ag.group.title}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({ag.group.defaultRole})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="ml-1 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemove(ag.group.id)}
                      disabled={isSubmitting}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Add new group */}
          {availableGroups.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Add Group</h4>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={groupPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={isSubmitting}
                      >
                        {selectedGroupId ? getGroupLabel(selectedGroupId) : "Select group..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0">
                      <Command>
                        <CommandInput placeholder="Search groups..." />
                        <CommandList>
                          <CommandEmpty>No groups available.</CommandEmpty>
                          <CommandGroup>
                            {availableGroups.map((group) => (
                              <CommandItem
                                key={group.id}
                                value={group.title}
                                onSelect={() => {
                                  setSelectedGroupId(group.id)
                                  setGroupPopoverOpen(false)
                                }}
                                data-checked={selectedGroupId === group.id}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{group.title}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {group.defaultRole}
                                  </Badge>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedGroupId === group.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedGroupId || isSubmitting}
                >
                  {isSubmitting ? <Spinner className="mr-2" /> : <PlusIcon className="mr-2 h-4 w-4" />}
                  Add
                </Button>
              </div>
            </div>
          )}

          {availableGroups.length === 0 && allGroups.length > 0 && (
            <p className="text-sm text-muted-foreground">
              All available groups have been assigned to this calendar.
            </p>
          )}

          {allGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No groups available. Create a group first to assign it to this calendar.
            </p>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
