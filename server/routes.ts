import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, insertPostSchema, insertMessageSchema, insertRatingSchema, insertFavoriteSchema, insertReportSchema, insertBlockSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware for JWT authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional authentication middleware (for guest access)
const optionalAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.userId);
      req.user = user;
    } catch (error) {
      // Continue without user if token is invalid
    }
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/me", authenticateToken, async (req: any, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // Post routes
  app.get("/api/posts", optionalAuth, async (req: any, res) => {
    try {
      const { city, premium, userId } = req.query;
      const filters: any = {};
      
      if (city) filters.city = city;
      if (premium === 'true') filters.isPremium = true;
      if (userId) filters.userId = parseInt(userId);

      const posts = await storage.getPosts(filters);
      
      // For each post, check if it's favorited by current user
      const postsWithFavorites = await Promise.all(
        posts.map(async (post) => {
          const isFavorited = req.user ? await storage.isFavorited(req.user.id, post.id) : false;
          return {
            ...post,
            user: { ...post.user, password: undefined },
            isFavorited
          };
        })
      );

      res.json(postsWithFavorites);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", optionalAuth, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Increment view count
      await storage.updatePost(postId, { viewCount: post.viewCount + 1 });

      const isFavorited = req.user ? await storage.isFavorited(req.user.id, post.id) : false;
      
      res.json({
        ...post,
        user: { ...post.user, password: undefined },
        isFavorited
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", authenticateToken, async (req: any, res) => {
    try {
      const postData = insertPostSchema.parse({ ...req.body, userId: req.user.id });
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Invalid post data" });
    }
  });

  app.put("/api/posts/:id", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post || post.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      const updatedPost = await storage.updatePost(postId, updates);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post || post.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // User profile routes
  app.get("/api/users/:id", optionalAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if current user has blocked this user or vice versa
      if (req.user) {
        const isBlocked = await storage.isBlocked(req.user.id, userId) || 
                         await storage.isBlocked(userId, req.user.id);
        if (isBlocked) {
          return res.status(403).json({ message: "User not accessible" });
        }
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      delete updates.password; // Don't allow password updates through this endpoint
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Message routes
  app.get("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const conversations = await storage.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", authenticateToken, async (req: any, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessages(req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({ ...req.body, senderId: req.user.id });
      
      // Check if users have blocked each other
      const isBlocked = await storage.isBlocked(req.user.id, messageData.receiverId) ||
                       await storage.isBlocked(messageData.receiverId, req.user.id);
      
      if (isBlocked) {
        return res.status(403).json({ message: "Cannot send message to this user" });
      }

      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Rating routes
  app.post("/api/ratings", authenticateToken, async (req: any, res) => {
    try {
      const ratingData = insertRatingSchema.parse({ ...req.body, raterId: req.user.id });
      
      if (ratingData.ratedUserId === req.user.id) {
        return res.status(400).json({ message: "Cannot rate yourself" });
      }

      // Check if user already rated this user
      const existingRating = await storage.getUserRating(ratingData.ratedUserId, req.user.id);
      if (existingRating) {
        // Update existing rating
        const updatedRating = await storage.updateRating(existingRating.id, ratingData.isPositive);
        return res.json(updatedRating);
      }

      const rating = await storage.rateUser(ratingData);
      res.json(rating);
    } catch (error) {
      console.error("Error rating user:", error);
      res.status(400).json({ message: "Failed to rate user" });
    }
  });

  // Favorite routes
  app.get("/api/favorites", authenticateToken, async (req: any, res) => {
    try {
      const favorites = await storage.getFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req: any, res) => {
    try {
      const favoriteData = insertFavoriteSchema.parse({ ...req.body, userId: req.user.id });
      const favorite = await storage.addFavorite(favoriteData);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:postId", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      await storage.removeFavorite(req.user.id, postId);
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Report routes
  app.post("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      const reportData = insertReportSchema.parse({ ...req.body, reporterId: req.user.id });
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: "Failed to create report" });
    }
  });

  // Block routes
  app.get("/api/blocks", authenticateToken, async (req: any, res) => {
    try {
      const blocks = await storage.getBlocks(req.user.id);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching blocks:", error);
      res.status(500).json({ message: "Failed to fetch blocks" });
    }
  });

  app.post("/api/blocks", authenticateToken, async (req: any, res) => {
    try {
      const blockData = insertBlockSchema.parse({ ...req.body, blockerId: req.user.id });
      
      if (blockData.blockedUserId === req.user.id) {
        return res.status(400).json({ message: "Cannot block yourself" });
      }

      const block = await storage.blockUser(blockData);
      res.json(block);
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(400).json({ message: "Failed to block user" });
    }
  });

  app.delete("/api/blocks/:userId", authenticateToken, async (req: any, res) => {
    try {
      const blockedUserId = parseInt(req.params.userId);
      await storage.unblockUser(req.user.id, blockedUserId);
      res.json({ message: "User unblocked" });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
