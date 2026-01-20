"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, UserMinus } from "lucide-react"
import { getGroupMembers, updateMemberRole, removeMember, regenerateGroupCode, toggleGroupCode } from "@/app/actions/groups"
import { GroupRole, Role } from "@prisma/client"
import { Skeleton } from "@/components/ui/skeleton"

interface GroupMember {
  id: string
  role: GroupRole
  joinedAt: Date
  user: {
    id: string
    name: string
    email: string
    role: Role
  }
}

interface ManageMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: {
    id: string
    title: string
    code: string
    codeActive: boolean
  } | null
  onUpdate?: () => void
}

export function ManageMembersDialog({
  open,
  onOpenChange,
  group,
  onUpdate,
}: ManageMembersDialogProps) {
  const [members, setMembers] = React.useState<GroupMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [removingId, setRemovingId] = React.useState<string | null>(null)
  const [regenerating, setRegenerating] = React.useState(false)
  const [togglingCode, setTogglingCode] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [currentCode, setCurrentCode] = React.useState("")
  const [codeActive, setCodeActive] = React.useState(true)

  const loadMembers = React.useCallback(async () => {
    if (!group?.id) return
    setLoading(true)
    try {
      const data = await getGroupMembers(group.id)
      setMembers(data as GroupMember[])
    } catch (error) {
      console.error("Failed to load members:", error)
    } finally {
      setLoading(false)
    }
  }, [group?.id])

  React.useEffect(() => {
    if (open && group) {
      setCurrentCode(group.code)
      setCodeActive(group.codeActive)
      loadMembers()
    }
  }, [open, group, loadMembers])

  const handleRoleChange = async (membershipId: string, role: GroupRole) => {
    setUpdatingId(membershipId)
    try {
      const result = await updateMemberRole(membershipId, role)
      if (result.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === membershipId ? { ...m, role } : m))
        )
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to update role:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveMember = async (membershipId: string) => {
    setRemovingId(membershipId)
    try {
      const result = await removeMember(membershipId)
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== membershipId))
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to remove member:", error)
    } finally {
      setRemovingId(null)
    }
  }

  const handleRegenerateCode = async () => {
    if (!group?.id) return
    setRegenerating(true)
    try {
      const result = await regenerateGroupCode(group.id)
      if (result.success && result.code) {
        setCurrentCode(result.code)
        setCodeActive(true)
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to regenerate code:", error)
    } finally {
      setRegenerating(false)
    }
  }

  const handleToggleCode = async () => {
    if (!group?.id) return
    setTogglingCode(true)
    try {
      const result = await toggleGroupCode(group.id, !codeActive)
      if (result.success) {
        setCodeActive(!codeActive)
        onUpdate?.()
      }
    } catch (error) {
      console.error("Failed to toggle code:", error)
    } finally {
      setTogglingCode(false)
    }
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(currentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Group: {group?.title}</DialogTitle>
          <DialogDescription>
            View members and manage joining code
          </DialogDescription>
        </DialogHeader>

        {/* Group Code Section */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Joining Code</span>
            <Badge variant={codeActive ? "default" : "secondary"}>
              {codeActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-lg font-mono tracking-wider">
              {currentCode}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              disabled={!codeActive}
              title="Copy code"
            >
              {copied ? "✓" : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerateCode}
              disabled={regenerating}
              title="Generate new code"
            >
              {regenerating ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleCode}
            disabled={togglingCode}
            className="w-full"
          >
            {togglingCode && <Spinner size="sm" className="mr-2" />}
            {codeActive ? "Disable Code" : "Enable Code"}
          </Button>
        </div>

        {/* Members Section */}
        <div className="flex-1 overflow-auto space-y-2">
          <h4 className="text-sm font-medium">
            Members ({members.length})
          </h4>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members yet. Share the code to invite people.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{member.user.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {member.user.email}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {member.user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value as GroupRole)
                      }
                      disabled={updatingId === member.id || removingId === member.id}
                    >
                      <SelectTrigger className="w-24">
                        {updatingId === member.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id || updatingId === member.id}
                      title="Remove member"
                    >
                      {removingId === member.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <UserMinus className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
