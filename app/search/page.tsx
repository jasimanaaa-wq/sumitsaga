"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Mountain,
  MapPin,
  Clock,
  ArrowLeft,
  Heart,
  X,
  MessageSquare,
  Users, // New icon for groups
  Plus, // New icon for adding
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input"; // Assuming you have this utility

// Fort data for Maharashtra
const fortsData = [
  {
    id: 1,
    name: "Lohgad Fort",
    region: "Pune",
    image: "/Lohagad.jpg",
    difficulty: "Easy",
    duration: "4-5 hours",
    description:
      "A magnificent hill fort with rich Maratha history and stunning valley views.",
    elevation: "1,033m",
  },
  {
    id: 2,
    name: "Visapur Fort",
    region: "Pune",
    image: "/visapur fort.jpeg",
    difficulty: "Moderate",
    duration: "3-4 hours",
    description:
      "Twin fort of Lohgad, known for its massive stone structures and caves.",
    elevation: "1,084m",
  },
  {
    id: 3,
    name: "Korigad Fort",
    region: "Pune",
    image: "/korigad.jpg",
    difficulty: "Moderate",
    duration: "3-4 hours",
    description:
      "A scenic fort offering panoramic views of Aamby Valley and surrounding hills.",
    elevation: "923m",
  },
  {
    id: 4,
    name: "Tikona Fort",
    region: "Pune",
    image: "/Tikona.jpeg",
    difficulty: "Moderate",
    duration: "4-5 hours",
    description:
      "Triangular-shaped fort famous for its unique architecture and trekking trails.",
    elevation: "1,033m",
  },
  {
    id: 5,
    name: "Kalavantin Durg",
    region: "Raigad",
    image: "/kalavanti.jpeg",
    difficulty: "Difficult",
    duration: "3-4 hours",
    description:
      "A cliff-top fortress known for its steep rock-cut steps and adventurous trek.",
    elevation: "701m",
  },
  {
    id: 6,
    name: "Prabalgad Fort",
    region: "Raigad",
    image: "/prabalgad.jpg",
    difficulty: "Moderate",
    duration: "4-5 hours",
    description:
      "A hill fort located between Matheran and Panvel, known for its historical significance and expansive plateau.",
    elevation: "700m",
  },
  {
    id: 7,
    name: "Sindhudurg Fort",
    region: "Kokan",
    image: "/sindhudurg.jpg",
    difficulty: "Easy",
    duration: "1-2 hours",
    description:
      "A sea fort built by Chhatrapati Shivaji Maharaj to protect the Konkan coastline from naval attacks.",
    elevation: "Sea level",
  },
  {
    id: 8,
    name: "Vijaydurg Fort",
    region: "Kokan",
    image: "/vijaydurg.jpg",
    difficulty: "Easy to Moderate",
    duration: "2-3 hours",
    description:
      "One of the oldest and strongest coastal forts, known for its triple-layered walls and naval history.",
    elevation: "Sea level",
  },
];

const regions = ["All Regions", "Kokan", "Raigad", "Pune"];
const categories = ["All", "Easy", "Moderate", "Difficult"];

// --- Dummy Chat Data & Types ---

type ChatGroup = {
  id: number;
  name: string;
  type: "Fort" | "Region" | "Custom";
  relatedEntity: string; // Fort name or Region name
  members: number; // Dummy member count
};

// Initial list of public chat groups (one per fort)
const initialGroups: ChatGroup[] = fortsData.map((fort, index) => ({
  id: index + 100, // Starting ID high to avoid collision
  name: `${fort.name} Trek Talk`,
  type: "Fort",
  relatedEntity: fort.name,
  members: 10 + index * 2,
}));

// --- Main Component ---

export default function SearchPage() {
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredForts, setFilteredForts] = useState(fortsData);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();

  // Dummy Chat State
  const [allChatGroups, setAllChatGroups] =
    useState<ChatGroup[]>(initialGroups);
  const [myChatGroups, setMyChatGroups] = useState<number[]>([]); // Array of group IDs the user has joined
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const toggleWishlist = (fortId: number) => {
    setWishlist((prev) =>
      prev.includes(fortId)
        ? prev.filter((id) => id !== fortId)
        : [...prev, fortId]
    );
  };

const joinGroup = (groupId: number) => {
  // 1. Update state (join the group and increase members)
  if (!myChatGroups.includes(groupId)) {
    setMyChatGroups((prev) => [...prev, groupId]);
    setIsChatOpen(false); // Close chat drawer after joining
    setAllChatGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, members: group.members + 1 }
          : group
      )
    );
  }

  // 2. Perform the Redirection
  // **CHANGE THIS LINE to match your desired, non-dynamic route**
  // Example: If your page is at `/chat`
  router.push(`C:\Users\susha\OneDrive\Doc\SummitSaga\sumitsaga\components\chat\sks.html`); // <--- UPDATED REDIRECT HERE

  // OR: If your page is at `/my-chat`
  // router.push(`/my-chat`);
};

  const handleCreateGroup = () => {
    if (newGroupName.trim() === "") return;

    const newGroup: ChatGroup = {
      id: Date.now(), // Unique ID
      name: newGroupName.trim(),
      type: "Custom",
      relatedEntity: "User-Created",
      members: 1, // Start with 1 member (the creator)
    };

    setAllChatGroups((prev) => [newGroup, ...prev]);
    setMyChatGroups((prev) => [...prev, newGroup.id]); // Auto-join creator
    setNewGroupName("");
    setIsCreatingGroup(false);
  };

  const handleSearch = () => {
    let results = fortsData;

    if (selectedRegion !== "All Regions") {
      results = results.filter((fort) => fort.region === selectedRegion);
    }

    if (selectedCategory !== "All") {
      results = results.filter((fort) => fort.difficulty === selectedCategory);
    }

    setFilteredForts(results);
  };

  const handleFortClick = (fortId: number) => {
    window.location.href = `/fort/${fortId}`;
  };

  const wishlistForts = fortsData.filter((fort) => wishlist.includes(fort.id));
  const joinedGroups = allChatGroups.filter((group) =>
    myChatGroups.includes(group.id)
  );
  const discoverGroups = allChatGroups.filter(
    (group) => !myChatGroups.includes(group.id)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/welcome">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Mountain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">SummitSaga</h1>
            </div>
          </div>

          {/* Category Dropdown + Chat Button + Wishlist Button */}
          <div className="flex items-center space-x-2">
            {/* Category Dropdown */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chat Button (New) */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              onClick={() => router.push("/group")}
            >
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>Groups &amp; Chat</span>
            </Button>

            {/* Wishlist Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              onClick={() => {
                setIsWishlistOpen(!isWishlistOpen);
                setIsChatOpen(false); // Close chat if opening wishlist
              }}
            >
              <Heart className="h-4 w-4 text-red-500" />
              <span>Wishlist ({wishlist.length})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Wishlist Drawer (No changes) */}
      {isWishlistOpen && (
        <div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border shadow-lg z-50 p-4 overflow-y-auto">
          {/* ... Wishlist Content ... */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />{" "}
              <span>My Wishlist</span>
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsWishlistOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {wishlistForts.length > 0 ? (
            <div className="space-y-4">
              {wishlistForts.map((fort) => (
                <Card key={fort.id} className="border-border">
                  <div className="flex items-center space-x-3 p-3">
                    <img
                      src={fort.image}
                      alt={fort.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{fort.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {fort.region}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(fort.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2" />
              <p>No forts in wishlist</p>
            </div>
          )}
        </div>
      )}

      {/* Chat Drawer (Updated) */}
      {isChatOpen && (
        <div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border shadow-lg z-50 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />{" "}
              <span>Fort Chat Hub</span>
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsChatOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Group Form */}
          <Card className="mb-4 border-dashed bg-secondary/10">
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Plus className="h-3 w-3 mr-1" /> Create Custom Group
              </h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="Group Name (e.g., Lohgad Trek Oct)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <Button
                  onClick={handleCreateGroup}
                  disabled={newGroupName.trim().length < 3}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Joined Groups List */}
          <h3 className="text-md font-semibold mt-6 mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            My Groups ({joinedGroups.length})
          </h3>
          {joinedGroups.length > 0 ? (
            <div className="space-y-2">
              {joinedGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-primary/20 cursor-pointer hover:bg-secondary transition-colors"
                  // In a real app, this would navigate to the chat room
                  onClick={() => router.push(`/chat/${group.id}`)}
                >
                  <div className="text-sm">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.relatedEntity} ({group.members} members)
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs h-5">
                    Joined
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              You haven't joined any groups yet.
            </p>
          )}

          {/* Discover Groups List */}
          <h3 className="text-md font-semibold mt-6 mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2 text-green-500" />
            Discover Public Groups
          </h3>
          <div className="space-y-2">
            {discoverGroups.length > 0 ? (
              discoverGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.relatedEntity} ({group.members} members)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => joinGroup(group.id)}
                  >
                    Join
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No new public groups to discover.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ... Rest of Main Content (Fort Search/Results) ... */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Discover Maharashtra Forts
            </h2>
            <p className="text-muted-foreground text-pretty">
              Explore historic forts across different regions of Maharashtra
            </p>
          </div>

          {/* Filters */}
          <Card className="border-border text-muted-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Search Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    State
                  </label>
                  <Select value="Maharashtra" disabled>
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Region
                  </label>
                  <Select
                    value={selectedRegion}
                    onValueChange={setSelectedRegion}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    Search Forts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">
                Found {filteredForts.length} fort
                {filteredForts.length !== 1 ? "s" : ""}
              </h3>
              <Badge variant="secondary" className="text-sm">
                {selectedRegion}
              </Badge>
            </div>

            {/* Fort Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForts.map((fort) => (
                <Card
                  key={fort.id}
                  className="border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg group"
                  onClick={() => handleFortClick(fort.id)}
                >
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={fort.image || "/placeholder.svg"}
                      alt={fort.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Wishlist Heart Button */}
                    <div className="absolute top-3 right-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`rounded-full ${
                          wishlist.includes(fort.id)
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(fort.id);
                        }}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            wishlist.includes(fort.id) ? "fill-red-500" : ""
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="secondary"
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        {fort.elevation}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {fort.name}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {fort.region}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="text-pretty mb-4">
                      {fort.description}
                    </CardDescription>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {fort.duration}
                      </div>
                      <Badge
                        variant={
                          fort.difficulty === "Easy" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        {fort.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredForts.length === 0 && (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <Mountain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No forts found
                  </h3>
                  <p className="text-muted-foreground text-pretty">
                    Try selecting a different region or category to discover
                    more forts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
