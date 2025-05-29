import { users, posts, messages, ratings, favorites, reports, blocks, type User, type InsertUser, type Post, type InsertPost, type Message, type InsertMessage, type Rating, type InsertRating, type Favorite, type InsertFavorite, type Report, type InsertReport, type Block, type InsertBlock } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Post methods
  getPosts(filters?: { city?: string; isPremium?: boolean; userId?: number }): Promise<(Post & { user: User })[]>;
  getPost(id: number): Promise<(Post & { user: User }) | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(userId1: number, userId2: number): Promise<(Message & { sender: User; receiver: User })[]>;
  getConversations(userId: number): Promise<{ otherUser: User; lastMessage: Message }[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  
  // Rating methods
  getUserRating(userId: number, raterId: number): Promise<Rating | undefined>;
  rateUser(rating: InsertRating): Promise<Rating>;
  updateRating(ratingId: number, isPositive: boolean): Promise<Rating | undefined>;
  
  // Favorite methods
  getFavorites(userId: number): Promise<(Favorite & { post: Post & { user: User } })[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, postId: number): Promise<boolean>;
  isFavorited(userId: number, postId: number): Promise<boolean>;
  
  // Report methods
  createReport(report: InsertReport): Promise<Report>;
  
  // Block methods
  getBlocks(userId: number): Promise<Block[]>;
  blockUser(block: InsertBlock): Promise<Block>;
  unblockUser(blockerId: number, blockedUserId: number): Promise<boolean>;
  isBlocked(blockerId: number, blockedUserId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getPosts(filters?: { city?: string; isPremium?: boolean; userId?: number }): Promise<(Post & { user: User })[]> {
    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        description: posts.description,
        city: posts.city,
        isPremium: posts.isPremium,
        images: posts.images,
        tags: posts.tags,
        isActive: posts.isActive,
        viewCount: posts.viewCount,
        favoriteCount: posts.favoriteCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.isActive, true))
      .orderBy(desc(posts.isPremium), desc(posts.createdAt));

    if (filters?.city) {
      query = query.where(and(eq(posts.isActive, true), eq(posts.city, filters.city)));
    }
    if (filters?.isPremium) {
      query = query.where(and(eq(posts.isActive, true), eq(posts.isPremium, true)));
    }
    if (filters?.userId) {
      query = query.where(and(eq(posts.isActive, true), eq(posts.userId, filters.userId)));
    }

    return await query;
  }

  async getPost(id: number): Promise<(Post & { user: User }) | undefined> {
    const [result] = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        description: posts.description,
        city: posts.city,
        isPremium: posts.isPremium,
        images: posts.images,
        tags: posts.tags,
        isActive: posts.isActive,
        viewCount: posts.viewCount,
        favoriteCount: posts.favoriteCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));

    return result || undefined;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async deletePost(id: number): Promise<boolean> {
    const [post] = await db
      .update(posts)
      .set({ isActive: false })
      .where(eq(posts.id, id))
      .returning();
    return !!post;
  }

  async getMessages(userId1: number, userId2: number): Promise<(Message & { sender: User; receiver: User })[]> {
    return await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: { 
          id: sql`sender.id`,
          username: sql`sender.username`,
          fullName: sql`sender.full_name`,
          avatar: sql`sender.avatar`,
        },
        receiver: {
          id: sql`receiver.id`, 
          username: sql`receiver.username`,
          fullName: sql`receiver.full_name`,
          avatar: sql`receiver.avatar`,
        },
      })
      .from(messages)
      .innerJoin(users.as('sender'), eq(messages.senderId, sql`sender.id`))
      .innerJoin(users.as('receiver'), eq(messages.receiverId, sql`receiver.id`))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt) as any;
  }

  async getConversations(userId: number): Promise<{ otherUser: User; lastMessage: Message }[]> {
    // This is a simplified implementation - in production you'd want a more optimized query
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversations = new Map();
    
    for (const message of userMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversations.has(otherUserId)) {
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
        if (otherUser) {
          conversations.set(otherUserId, { otherUser, lastMessage: message });
        }
      }
    }

    return Array.from(conversations.values());
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();
    return !!message;
  }

  async getUserRating(userId: number, raterId: number): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.ratedUserId, userId), eq(ratings.raterId, raterId)));
    return rating || undefined;
  }

  async rateUser(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    
    // Update user's rating count and average
    const userRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, rating.ratedUserId));
    
    const positiveRatings = userRatings.filter(r => r.isPositive).length;
    const totalRatings = userRatings.length;
    const ratingPercentage = Math.round((positiveRatings / totalRatings) * 100);
    
    await db
      .update(users)
      .set({ rating: ratingPercentage, ratingCount: totalRatings })
      .where(eq(users.id, rating.ratedUserId));

    return newRating;
  }

  async updateRating(ratingId: number, isPositive: boolean): Promise<Rating | undefined> {
    const [rating] = await db
      .update(ratings)
      .set({ isPositive })
      .where(eq(ratings.id, ratingId))
      .returning();
    return rating || undefined;
  }

  async getFavorites(userId: number): Promise<(Favorite & { post: Post & { user: User } })[]> {
    return await db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        postId: favorites.postId,
        createdAt: favorites.createdAt,
        post: {
          id: posts.id,
          userId: posts.userId,
          title: posts.title,
          description: posts.description,
          city: posts.city,
          isPremium: posts.isPremium,
          images: posts.images,
          tags: posts.tags,
          isActive: posts.isActive,
          viewCount: posts.viewCount,
          favoriteCount: posts.favoriteCount,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          user: users,
        },
      })
      .from(favorites)
      .innerJoin(posts, eq(favorites.postId, posts.id))
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(favorites.userId, userId)) as any;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    
    // Update post favorite count
    await db
      .update(posts)
      .set({ favoriteCount: sql`favorite_count + 1` })
      .where(eq(posts.id, favorite.postId));

    return newFavorite;
  }

  async removeFavorite(userId: number, postId: number): Promise<boolean> {
    const [favorite] = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.postId, postId)))
      .returning();
    
    if (favorite) {
      // Update post favorite count
      await db
        .update(posts)
        .set({ favoriteCount: sql`favorite_count - 1` })
        .where(eq(posts.id, postId));
    }

    return !!favorite;
  }

  async isFavorited(userId: number, postId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.postId, postId)));
    return !!favorite;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getBlocks(userId: number): Promise<Block[]> {
    return await db.select().from(blocks).where(eq(blocks.blockerId, userId));
  }

  async blockUser(block: InsertBlock): Promise<Block> {
    const [newBlock] = await db.insert(blocks).values(block).returning();
    return newBlock;
  }

  async unblockUser(blockerId: number, blockedUserId: number): Promise<boolean> {
    const [block] = await db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedUserId, blockedUserId)))
      .returning();
    return !!block;
  }

  async isBlocked(blockerId: number, blockedUserId: number): Promise<boolean> {
    const [block] = await db
      .select()
      .from(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedUserId, blockedUserId)));
    return !!block;
  }
}

export const storage = new DatabaseStorage();
