"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  increment,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"
import { ArrowLeft, CalendarIcon, Clock, MapPin, Mountain, Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getDb } from "@/lib/firebase"
import { useRequireUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

type GroupDoc = {
  name: string
  fortName: string
  description: string
  date: string
  meetingPoint: string
  meetingTime: string
  difficulty: string
  maxMembers: number
  memberCount: number
  memberIds: string[]
  members: Record<string, string>
  organizerId: string
  organizerName: string
}

type Message = {
  id: string
  text: string
  senderId: string
  senderName: string
  createdAt: Date | null
}

export default function GroupChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, name, ready, signOut } = useRequireUser()

  const [group, setGroup] = useState<GroupDoc | null>(null)
  const [groupState, setGroupState] = useState<"loading" | "ready" | "missing">("loading")
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isMember = !!user && !!group?.memberIds.includes(user.uid)

  // Live group document
  useEffect(() => {
    if (!user || !id) return
    return onSnapshot(
      doc(getDb(), "groups", id),
      (snap) => {
        if (!snap.exists()) {
          setGroupState("missing")
          return
        }
        setGroup(snap.data() as GroupDoc)
        setGroupState("ready")
      },
      (e) => setActionError(e.message),
    )
  }, [user, id])

  // Live messages (members only; Firestore rules enforce this too)
  useEffect(() => {
    if (!user || !id || !isMember) return
    const q = query(collection(getDb(), "groups", id, "messages"), orderBy("createdAt", "asc"), limitToLast(200))
    return onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            // "estimate" shows a just-sent message immediately instead of waiting for the server timestamp
            const m = d.data({ serverTimestamps: "estimate" })
            return {
              id: d.id,
              text: m.text,
              senderId: m.senderId,
              senderName: m.senderName,
              createdAt: m.createdAt ? m.createdAt.toDate() : null,
            }
          }),
        )
      },
      (e) => setActionError(e.message),
    )
  }, [user, id, isMember])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !user || sending) return
    setSending(true)
    setActionError(null)
    try {
      await addDoc(collection(getDb(), "groups", id, "messages"), {
        text: text.slice(0, 1000),
        senderId: user.uid,
        senderName: name,
        createdAt: serverTimestamp(),
      })
      setDraft("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not send message")
    } finally {
      setSending(false)
    }
  }

  const joinGroup = async () => {
    if (!user) return
    setActionError(null)
    try {
      const ref = doc(getDb(), "groups", id)
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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not join group")
    }
  }

  const leaveGroup = async () => {
    if (!user || !group || user.uid === group.organizerId) return
    if (!confirm("Leave this group?")) return
    try {
      await runTransaction(getDb(), async (tx) => {
        const ref = doc(getDb(), "groups", id)
        const snap = await tx.get(ref)
        if (!snap.exists() || !snap.data().memberIds.includes(user.uid)) return
        tx.update(ref, {
          memberIds: arrayRemove(user.uid),
          memberCount: increment(-1),
          [`members.${user.uid}`]: deleteField(),
        })
      })
      router.push("/group")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not leave group")
    }
  }

  if (!ready || groupState === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  }
  if (groupState === "missing" || !group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">This group doesn't exist.</p>
        <Button asChild>
          <Link href="/group">Back to groups</Link>
        </Button>
      </div>
    )
  }

  const full = group.memberCount >= group.maxMembers

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/group">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Groups
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Mountain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isMember && user?.uid !== group.organizerId && (
              <Button variant="outline" size="sm" onClick={leaveGroup}>
                Leave group
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6 flex-1">
        {/* Chat */}
        <Card className="flex flex-col h-[calc(100vh-10rem)]">
          {isMember ? (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm mt-8">
                    No messages yet. Say hello to your fellow trekkers!
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.senderId === user?.uid
                  return (
                    <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                      <span className="text-xs text-muted-foreground mb-0.5">
                        {mine ? "You" : m.senderName}
                        {m.createdAt && ` · ${format(m.createdAt, "MMM d, h:mm a")}`}
                      </span>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                          mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </CardContent>
              <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={1000}
                  className="bg-background"
                />
                <Button type="submit" disabled={!draft.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-muted-foreground max-w-sm">Join this group to read and send messages.</p>
              <Button onClick={joinGroup} disabled={full}>
                {full ? "Group Full" : "Join Group"}
              </Button>
            </CardContent>
          )}
          {actionError && <p className="text-sm text-destructive px-4 pb-3">{actionError}</p>}
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{group.fortName}</CardTitle>
                <Badge variant={group.difficulty === "Easy" ? "secondary" : "outline"}>{group.difficulty}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-foreground">{group.description}</p>
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-2" />
                {format(new Date(group.date), "MMM dd, yyyy")}
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-2" />
                {group.meetingTime}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-2" />
                {group.meetingPoint}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Members ({group.memberCount}/{group.maxMembers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {Object.entries(group.members ?? {}).map(([uid, memberName]) => (
                  <li key={uid} className="flex items-center justify-between">
                    <span className="text-foreground">
                      {memberName}
                      {uid === user?.uid && " (you)"}
                    </span>
                    {uid === group.organizerId && <Badge variant="secondary">Organizer</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
