import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PostCard } from "@/components/post-card";
import { getAuthHeaders } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Shield, 
  Flag, 
  Ban,
  Crown,
  CheckCircle,
  Mail,
  Phone,
  Loader2,
  Heart,
  Edit,
  Camera
} from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const profileId = parseInt(id as string);
  const isOwnProfile = currentUser?.id === profileId;

  // Fetch user profile
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/users", profileId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        if (response.status === 403) {
          throw new Error("This user is not accessible");
        }
        throw new Error("Failed to load profile");
      }
      return response.json();
    },
    enabled: !!profileId,
  });

  // Fetch user's posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", { userId: profileId }],
    queryFn: async () => {
      const response = await fetch(`/api/posts?userId=${profileId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to load posts");
      }
      return response.json();
    },
    enabled: !!profileId,
  });

  // Rate user mutation
  const rateMutation = useMutation({
    mutationFn: async (isPositive: boolean) => {
      const response = await apiRequest("POST", "/api/ratings", {
        ratedUserId: profileId,
        isPositive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileId] });
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit rating",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block user mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/blocks", {
        blockedUserId: profileId,
      });
      return response.json();
    },
    onSuccess: () => {
      setBlockDialogOpen(false);
      toast({
        title: "User blocked",
        description: "You will no longer see content from this user.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to block user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Report user mutation
  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest("POST", "/api/reports", {
        reportedUserId: profileId,
        reason,
        description: `Report against user ${user?.username}`,
      });
      return response.json();
    },
    onSuccess: () => {
      setReportDialogOpen(false);
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartConversation = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to send messages",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    navigate(`/messages/${profileId}`);
  };

  const handleRating = (isPositive: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to rate users",
        variant: "destructive",
      });
      return;
    }
    if (isOwnProfile) {
      toast({
        title: "Cannot rate yourself",
        description: "You cannot rate your own profile",
        variant: "destructive",
      });
      return;
    }
    rateMutation.mutate(isPositive);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Available</h3>
            <p className="text-gray-600 mb-4">
              {userError.message || "This profile could not be loaded."}
            </p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center space-y-4 mb-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.avatar || ""} alt={user.fullName || user.username} />
                      <AvatarFallback className="text-2xl">
                        {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8">
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {user.fullName || user.username}
                      </h1>
                      {user.isVerified && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                      {user.isPremium && (
                        <Crown className="h-6 w-6 text-amber-500" />
                      )}
                    </div>
                    
                    {user.age && (
                      <p className="text-gray-600">{user.age} years old</p>
                    )}
                    
                    <div className="flex items-center justify-center space-x-1 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{user.city}</span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-1 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(user.createdAt!)}</span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-amber-400 fill-current" />
                    <span className="text-lg font-semibold">
                      {user.rating || 0}% Positive
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {user.ratingCount || 0} ratings
                  </p>
                  
                  {/* Rating Buttons */}
                  {isAuthenticated && !isOwnProfile && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRating(true)}
                        disabled={rateMutation.isPending}
                        className="flex-1"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Positive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRating(false)}
                        disabled={rateMutation.isPending}
                        className="flex-1"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Negative
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-gray-600 text-sm">{user.bio}</p>
                  </div>
                )}

                {/* Preferences */}
                {user.preferences && user.preferences.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-1">
                      {user.preferences.slice(0, 6).map((preference, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {preference}
                        </Badge>
                      ))}
                      {user.preferences.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.preferences.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info (if own profile or if contact info is public) */}
                {(isOwnProfile || user.phone || user.email) && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <div className="space-y-2">
                      {user.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {isOwnProfile ? (
                    <Button className="w-full" asChild>
                      <Link href={`/profile/${user.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleStartConversation} className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      
                      <div className="flex space-x-2">
                        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Flag className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Report User</DialogTitle>
                              <DialogDescription>
                                Please select a reason for reporting this user.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              {[
                                "Inappropriate behavior",
                                "Spam or fake profile",
                                "Harassment",
                                "Underage user",
                                "Other safety concern"
                              ].map((reason) => (
                                <Button
                                  key={reason}
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => reportMutation.mutate(reason)}
                                  disabled={reportMutation.isPending}
                                >
                                  {reportMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Flag className="h-4 w-4 mr-2" />
                                  )}
                                  {reason}
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Block User</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to block this user? You won't see their posts or be able to message each other.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex space-x-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setBlockDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => blockMutation.mutate()}
                                disabled={blockMutation.isPending}
                              >
                                {blockMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4 mr-2" />
                                )}
                                Block User
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts">
                  Posts ({userPosts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="photos">
                  Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userPosts && userPosts.length > 0 ? (
                  <div className="grid gap-6">
                    {userPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isOwnProfile ? "You haven't created any posts yet" : "No posts yet"}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {isOwnProfile 
                          ? "Share your first listing with the community"
                          : "This user hasn't shared any posts yet"
                        }
                      </p>
                      {isOwnProfile && (
                        <Button asChild>
                          <Link href="/create-post">Create Your First Post</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                {user.images && user.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {user.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos</h3>
                      <p className="text-gray-500">
                        {isOwnProfile 
                          ? "Add photos to your profile to help others get to know you"
                          : "This user hasn't added any photos yet"
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
