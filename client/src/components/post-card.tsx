import { useState } from "react";
import { Link } from "wouter";
import { Post, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Heart, MessageCircle, Share, MapPin, Clock, ThumbsUp, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: Post & { 
    user: User; 
    isFavorited?: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localIsFavorited, setLocalIsFavorited] = useState(post.isFavorited || false);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (localIsFavorited) {
        return apiRequest("DELETE", `/api/favorites/${post.id}`);
      } else {
        return apiRequest("POST", "/api/favorites", { postId: post.id });
      }
    },
    onSuccess: () => {
      setLocalIsFavorited(!localIsFavorited);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: localIsFavorited ? "Removed from favorites" : "Added to favorites",
        description: localIsFavorited 
          ? "Post removed from your favorites"
          : "Post saved to your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to save favorites",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.origin + `/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard",
      });
    }
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} days ago`;
    }
  };

  return (
    <Card className={`post-card ${post.isPremium ? "premium" : ""}`}>
      {post.isPremium && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="premium-badge">
            <Crown className="h-3 w-3 mr-1" />
            VIP
          </Badge>
        </div>
      )}

      {/* Post Image */}
      {post.images && post.images.length > 0 && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {post.user.isVerified && (
            <div className="absolute bottom-3 left-3">
              <Badge className="status-online">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4">
        {/* User Info */}
        <div className="flex items-center mb-3">
          <Avatar className="w-8 h-8 mr-3">
            <AvatarImage src={post.user.avatar || ""} alt={post.user.fullName || post.user.username} />
            <AvatarFallback>
              {(post.user.fullName || post.user.username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <span className="font-medium text-gray-900">
                {post.user.fullName || post.user.username}
              </span>
              {post.user.isVerified && (
                <div className="verified-badge ml-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{post.city}</span>
              <span className="mx-2">•</span>
              <Clock className="h-3 w-3 mr-1" />
              <span>{timeAgo(post.createdAt!)}</span>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{post.description}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span className="text-sm">{post.user.rating || 0}%</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              disabled={favoriteMutation.isPending}
              className={`text-gray-500 hover:text-red-500 ${localIsFavorited ? "text-red-500" : ""}`}
            >
              <Heart className={`h-4 w-4 ${localIsFavorited ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-gray-500 hover:text-primary">
              <Share className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild size="sm">
            <Link href={`/profile/${post.user.id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
