import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Heart, Star, CheckCircle, Crown } from "lucide-react";

export default function Home() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

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
    { label: "Active Users", value: "2,500+" },
    { label: "Cities Covered", value: "10+" },
    { label: "Safety Reports", value: "99.8%" },
    { label: "Verified Profiles", value: "85%" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Humboldt Connect
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional classified platform serving Humboldt County with safety and privacy as our top priorities
            </p>
            
            {/* Safety Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                18+ Verified
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                <Shield className="h-4 w-4 mr-2" />
                Secure Platform
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">
                <Crown className="h-4 w-4 mr-2" />
                Premium Features
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/register">
                  Join Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link href="/dashboard">
                  Browse as Guest
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-lg px-8 py-3">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Humboldt Connect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We prioritize safety, authenticity, and meaningful connections in our local community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
            <Shield className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Safety & Age Verification</h3>
            <p className="text-gray-700 mb-6">
              This platform is strictly for adults 18 years and older. We require age verification 
              and maintain strict community guidelines to ensure a safe environment for all users.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/safety">
                  Safety Guidelines
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/verification">
                  Verification Process
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/terms">
                  Terms of Service
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Connect?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of verified users in Humboldt County
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
              <Link href="/register">
                Create Account
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-primary">
              <Link href="/dashboard">
                Browse Listings
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
