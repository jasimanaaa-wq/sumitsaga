"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { useRequireUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Mountain, Users, CalendarIcon, ArrowLeft, MapPin, Clock, Plus, UserPlus, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Group = {
  id: string
  name: string
  fortId: string
  fortName: string
  date: string // yyyy-MM-dd
  members: number
  maxMembers: number
  organizerId: string
  organizer: string
  description: string
  difficulty: string
  meetingPoint: string
  meetingTime: string
  memberIds: string[]
}

const fortsData: Record<string, string> = {
  "1": "Lohgad Fort",
  "2": "Visapur Fort",
  "3": "Korigad Fort",
  "4": "Tikona Fort",
  "5": "Kalawantin Durg",
  "6": "Prabalgad Fort",
}

export default function GroupPage() {
  const router = useRouter()
  const { user, name, ready, signOut } = useRequireUser()
  const [groups, setGroups] = useState<Group[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const [selectedFort, setSelectedFort] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [maxMembers, setMaxMembers] = useState("10")
  const [difficulty, setDifficulty] = useState("Moderate")
  const [meetingPoint, setMeetingPoint] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Get fort ID from URL params if coming from fort details page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const fortId = urlParams.get("fort")
    if (fortId && fortsData[fortId]) {
      setSelectedFort(fortId)
    }
  }, [])

  // Live list of groups
  useEffect(() => {
    if (!user) return
    const q = query(collection(getDb(), "groups"), orderBy("createdAt", "desc"))
    return onSnapshot(
      q,
      (snap) => {
        setGroups(
          snap.docs.map((d) => {
            const g = d.data()
            return {
              id: d.id,
              name: g.name,
              fortId: g.fortId,
              fortName: g.fortName,
              date: g.date,
              members: g.memberCount,
              maxMembers: g.maxMembers,
              organizerId: g.organizerId,
              organizer: g.organizerName,
              description: g.description,
              difficulty: g.difficulty,
              meetingPoint: g.meetingPoint,
              meetingTime: g.meetingTime,
              memberIds: g.memberIds ?? [],
            } as Group
          }),
        )
        setGroupsLoading(false)
      },
      (e) => {
        setActionError(e.message)
        setGroupsLoading(false)
      },
    )
  }, [user])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!selectedDate) {
      setActionError("Please pick a trek date.")
      return
    }
    setIsCreating(true)
    setActionError(null)
    try {
      const ref = await addDoc(collection(getDb(), "groups"), {
        name: groupName.trim(),
        fortId: selectedFort,
        fortName: fortsData[selectedFort],
        description: description.trim(),
        date: format(selectedDate, "yyyy-MM-dd"),
        meetingPoint: meetingPoint.trim(),
        meetingTime,
        difficulty,
        maxMembers: Number(maxMembers),
        memberCount: 1,
        memberIds: [user.uid],
        members: { [user.uid]: name },
        organizerId: user.uid,
        organizerName: name,
        createdAt: serverTimestamp(),
      })
      router.push(`/group/${ref.id}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not create group")
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return
    setJoiningId(groupId)
    setActionError(null)
    try {
      const ref = doc(getDb(), "groups", groupId)
      await runTransaction(getDb(), async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists()) throw new Error("This group no longer exists.")
        const g = snap.data()
        if (g.memberIds.includes(user.uid)) return
        if (g.memberCount >= g.maxMembers) throw new Error("This group is full.")
        tx.update(ref, {
          memberIds: arrayUnion(user.uid),
          memberCount: increment(1),
          [`members.${user.uid}`]: name,
        })
      })
      router.push(`/group/${groupId}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not join group")
      setJoiningId(null)
    }
  }

  if (!ready || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/search">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Search
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Mountain className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Forts Explorer</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{name}</span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground text-balance">Group Management</h2>
            <p className="text-muted-foreground text-pretty">
              Create a new group or join existing ones to explore forts together
            </p>
          </div>

          {/* Tabs for Create/Join */}
          <Card className="border-border">
            <CardContent className="p-6">
              <Tabs defaultValue="join" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="join" className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join a Group
                  </TabsTrigger>
                  <TabsTrigger value="create" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Group
                  </TabsTrigger>
                </TabsList>

                {/* Join Existing Groups */}
                <TabsContent value="join" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Available Groups</h3>

                    {actionError && <p className="text-sm text-destructive">{actionError}</p>}
                    {groupsLoading && <p className="text-muted-foreground">Loading groups…</p>}
                    {!groupsLoading && groups.length === 0 && (
                      <p className="text-muted-foreground">No groups yet. Be the first to create one!</p>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      {groups.map((group) => (
                        <Card key={group.id} className="border-border hover:border-primary/50 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{group.name}</CardTitle>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mountain className="h-3 w-3 mr-1" />
                                  {group.fortName}
                                </div>
                              </div>
                              <Badge variant={group.difficulty === "Easy" ? "secondary" : "outline"}>
                                {group.difficulty}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <CardDescription className="text-pretty">{group.description}</CardDescription>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {format(new Date(`${group.date}T00:00:00`), "MMM dd, yyyy")}
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {group.meetingTime}
                                </div>
                              </div>

                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {group.meetingPoint}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-muted-foreground">
                                  <Users className="h-3 w-3 mr-1" />
                                  {group.members}/{group.maxMembers} members
                                </div>
                                <span className="text-xs text-muted-foreground">by {group.organizer}</span>
                              </div>
                            </div>

                            <Separator />

                            {user && group.memberIds.includes(user.uid) ? (
                              <Button asChild className="w-full">
                                <Link href={`/group/${group.id}`}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Open Chat
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleJoinGroup(group.id)}
                                className="w-full"
                                disabled={group.members >= group.maxMembers || joiningId === group.id}
                              >
                                {group.members >= group.maxMembers
                                  ? "Group Full"
                                  : joiningId === group.id
                                    ? "Joining..."
                                    : "Join Group"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Create New Group */}
                <TabsContent value="create" className="space-y-6">
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Create New Group</h3>

                    <form onSubmit={handleCreateGroup} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="group-name">Group Name</Label>
                          <Input
                            id="group-name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g., Lohgad Weekend Warriors"
                            required
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fort-select">Select Fort</Label>
                          <select
                            id="fort-select"
                            value={selectedFort}
                            onChange={(e) => setSelectedFort(e.target.value)}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Choose a fort</option>
                            {Object.entries(fortsData).map(([id, name]) => (
                              <option key={id} value={id}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your group and what makes it special..."
                          required
                          className="bg-background min-h-[100px]"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Trek Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-background",
                                  !selectedDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max-members">Max Members</Label>
                          <Input
                            id="max-members"
                            type="number"
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(e.target.value)}
                            min="2"
                            max="20"
                            required
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="meeting-time">Meeting Time</Label>
                          <Input
                            id="meeting-time"
                            type="time"
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            required
                            className="bg-background"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <select
                          id="difficulty"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option>Easy</option>
                          <option>Moderate</option>
                          <option>Hard</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meeting-point">Meeting Point</Label>
                        <Input
                          id="meeting-point"
                          value={meetingPoint}
                          onChange={(e) => setMeetingPoint(e.target.value)}
                          placeholder="e.g., Fort Base Village, Railway Station"
                          required
                          className="bg-background"
                        />
                      </div>

                      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

                      <Button type="submit" className="w-full" disabled={isCreating}>
                        {isCreating ? "Creating Group..." : "Create Group"}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
