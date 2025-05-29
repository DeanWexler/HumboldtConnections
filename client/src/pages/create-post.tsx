import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Crown, Shield, Camera, Plus } from "lucide-react";

const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description must be less than 1000 characters"),
  city: z.string().min(1, "Please select a city"),
  isPremium: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

const HUMBOLDT_CITIES = [
  "Eureka", 
  "Arcata",
  "Fortuna",
  "McKinleyville",
  "Ferndale",
  "Blue Lake",
  "Trinidad",
  "Garberville",
  "Crescent City"
];

const SUGGESTED_TAGS = [
  "Outdoor Activities",
  "Arts & Culture", 
  "Fitness & Health",
  "Coffee & Conversation",
  "Adventure Sports",
  "Music & Entertainment",
  "Food & Dining",
  "Photography",
  "Travel",
  "Reading",
  "Movies & TV",
  "Gaming",
  "Dancing",
  "Yoga & Meditation",
  "Beach Activities",
  "Hiking & Nature",
  "Wine Tasting",
  "Live Music",
  "Art Galleries",
  "Local Events"
];

export default function CreatePost() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      isPremium: false,
      tags: [],
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostFormData & { images: string[] }) => {
      const response = await apiRequest("POST", "/api/posts", data);
      return response.json();
    },
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post created successfully!",
        description: "Your listing is now live and visible to other users.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create post",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to create a post
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (selectedImages.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images per post.",
        variant: "destructive",
      });
      return;
    }

    // Create previews
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim()) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const onSubmit = async (data: CreatePostFormData) => {
    // For now, we'll use placeholder URLs for images
    // In a real implementation, you'd upload to a service like Cloudinary or S3
    const imageUrls = imagePreviews.map((_, index) => 
      `https://via.placeholder.com/400x300?text=Image+${index + 1}`
    );

    const postData = {
      ...data,
      tags: selectedTags,
      images: imageUrls,
    };

    createPostMutation.mutate(postData);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
          <p className="text-gray-600 mt-2">
            Share your listing with the Humboldt County community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Provide clear, honest information about your listing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Write a compelling title for your listing..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Make it clear and specific (5-100 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what you're offering, your interests, availability, and any other relevant details..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Be honest and detailed (20-1000 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* City */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HUMBOLDT_CITIES.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the city where you're located
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Images */}
                    <div>
                      <FormLabel>Photos (Optional)</FormLabel>
                      <div className="mt-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          
                          {selectedImages.length < 5 && (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500">Add Photo</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </label>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Upload up to 5 photos. First photo will be your main image.
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <div className="mt-2">
                        {/* Selected Tags */}
                        {selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {selectedTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="pr-1">
                                {tag}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 ml-1 hover:bg-transparent"
                                  onClick={() => removeTag(tag)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Add Custom Tag */}
                        {selectedTags.length < 5 && (
                          <div className="flex gap-2 mb-4">
                            <Input
                              placeholder="Add custom tag..."
                              value={customTag}
                              onChange={(e) => setCustomTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomTag();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addCustomTag}
                              disabled={!customTag.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Suggested Tags */}
                        {selectedTags.length < 5 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Suggested tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {SUGGESTED_TAGS.slice(0, 10).map((tag) => (
                                <Button
                                  key={tag}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addTag(tag)}
                                  disabled={selectedTags.includes(tag)}
                                  className="text-xs"
                                >
                                  {tag}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Premium Toggle */}
                    <FormField
                      control={form.control}
                      name="isPremium"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center">
                              <Crown className="h-4 w-4 mr-2 text-amber-500" />
                              Make this a Premium Post
                            </FormLabel>
                            <FormDescription>
                              Premium posts get priority placement and enhanced visibility
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Create Post
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Safety Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your safety is our priority. Always meet in public places and trust your instincts.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Before posting:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Use clear, honest descriptions</li>
                    <li>• Include recent photos</li>
                    <li>• Verify your location</li>
                    <li>• Review community guidelines</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Platform features:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• User verification system</li>
                    <li>• Rating & review system</li>
                    <li>• Report & block options</li>
                    <li>• 18+ age verification</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}