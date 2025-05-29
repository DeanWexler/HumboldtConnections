import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Heart, Star, CheckCircle, Crown, Quote, UserPlus, Edit, Search, MapPin } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "Eureka",
    rating: 5,
    text: "I found my perfect match through Skip2Love! The community here is so genuine and welcoming. We've been together for 8 months now! 💕",
    verified: true
  },
  {
    name: "Jake R.",
    location: "Arcata",
    rating: 5,
    text: "As someone new to Humboldt County, this platform helped me connect with amazing local people. The verification process made me feel safe and confident.",
    verified: true
  },
  {
    name: "Maria L.",
    location: "Fortuna",
    rating: 5,
    text: "Skip2Love isn't just about dating - I've made wonderful friendships too! The rose-themed design is so romantic and beautiful. Highly recommend! 🌹",
    verified: true
  }
];

export default function Home() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Shield,
      title: "Safety First",
      description: "Age verification, user reporting, and safety guidelines to protect our community"
    },
    {
      icon: Users,
      title: "Local Community", 
      description: "Connect with verified users in Humboldt County with shared interests and preferences"
    },
    {
      icon: Heart,
      title: "Quality Connections",
      description: "Premium features and user ratings help you find meaningful connections"
    },
    {
      icon: Star,
      title: "Premium Experience",
      description: "VIP listings, priority placement, and enhanced visibility for serious users"
    }
  ];

  const stats = [
    { label: "Verified Singles", value: "2,500+", icon: Users },
    { label: "Love Stories", value: "450+", icon: Heart },
    { label: "Safe & Secure", value: "100%", icon: Shield },
    { label: "Beautiful Cities", value: "9", icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-background rose-pattern">
      {/* Hero Section */}
      <section className="romantic-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="logo-text">Skip2Love</span> 🌹
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
              Find Your Perfect Match in <span className="text-primary">Humboldt County</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Where authentic connections bloom like roses in Northern California's most romantic setting. Join our trusted community of verified singles seeking meaningful relationships.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!isAuthenticated ? (
              <>
                <Button size="lg" asChild className="text-lg px-8 py-6 shadow-lg">
                  <Link href="/register">
                    <Heart className="h-5 w-5 mr-2" />
                    Start Your Love Story
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                  <Link href="/dashboard">
                    <Search className="h-5 w-5 mr-2" />
                    Browse Singles
                  </Link>
                </Button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex gap-4">
                  <Button size="lg" asChild className="text-lg px-8 py-6 shadow-lg">
                    <Link href="/create-post">
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Your Profile
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                    <Link href="/profile">
                      <Edit className="h-5 w-5 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
                <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
                  <Link href="/dashboard">
                    <Search className="h-5 w-5 mr-2" />
                    Browse All Profiles
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Professional Bio */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Welcome to Skip2Love Humboldt - Your Premier Dating Destination
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Skip2Love Humboldt is a professional, secure, and romantic platform designed exclusively for singles in Humboldt County seeking authentic connections. Our community prioritizes safety, verification, and genuine relationships over casual encounters. With advanced matching features, comprehensive profiles, and a commitment to your privacy, we create an environment where meaningful love stories begin. Whether you're looking for your soulmate, a life partner, or simply someone special to share Humboldt's natural beauty with, our platform connects hearts with intention and care.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              💕 Love Stories from Our Community
            </h2>
            <p className="text-lg text-muted-foreground">
              Real testimonials from real couples who found love through Skip2Love
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Quote className="h-8 w-8 text-primary mr-3" />
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                    {testimonial.verified && (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Skip2Love Humboldt? 🌹
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've created the perfect environment for meaningful connections to flourish in beautiful Humboldt County
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Find Your Perfect Match? 💕
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of verified singles in Humboldt County who are serious about finding love
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6 shadow-lg">
              <Link href="/register">
                <Heart className="h-5 w-5 mr-2" />
                Create Free Account
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}