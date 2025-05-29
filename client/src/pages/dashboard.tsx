import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PostCard } from "@/components/post-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, TrendingUp, Users, Star, Crown } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    city: "",
    isPremium: false,
    isVerified: false,
    minAge: "",
    maxAge: "",
    preferences: [] as string[],
  });

  // Get search query from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location]);

  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (filters.city) params.append("city", filters.city);
    if (filters.isPremium) params.append("premium", "true");
    if (searchQuery) params.append("search", searchQuery);
    return `/api/posts?${params.toString()}`;
  };

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["/api/posts", filters, searchQuery],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      return response.json();
    },
  });

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/create-post");
  };

  // Calculate stats
  const stats = {
    total: posts?.length || 0,
    premium: posts?.filter((p: any) => p.isPremium).length || 0,
    verified: posts?.filter((p: any) => p.user.isVerified).length || 0,
    recent: posts?.filter((p: any) => {
      const createdAt = new Date(p.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }).length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1">
            <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 mt-6 lg:mt-0">
            
            {/* Stats Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                      <div className="text-sm text-gray-500">Total Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{stats.premium}</div>
                      <div className="text-sm text-gray-500">Premium</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                      <div className="text-sm text-gray-500">Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
                      <div className="text-sm text-gray-500">Today</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Sort by:</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="premium">Premium First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={handleCreatePost} className="hidden sm:flex">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchQuery ? `Search Results for "${searchQuery}"` : "Recent Listings"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.total} results in Humboldt County
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-gray-500">Failed to load posts. Please try again.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && posts?.length === 0 && (
              <Card className="p-8 text-center">
                <CardContent>
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? "Try adjusting your search terms or filters"
                      : "Be the first to create a post in this area"
                    }
                  </p>
                  <Button onClick={handleCreatePost}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Posts Grid */}
            {!isLoading && !error && posts && posts.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Load More Button */}
                {posts.length >= 12 && (
                  <div className="text-center mt-8">
                    <Button variant="outline">
                      Load More Results
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <Button
        onClick={handleCreatePost}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
