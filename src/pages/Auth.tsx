
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Please check your email for verification link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-30">
          <div
            className="absolute inset-0 rounded-full bg-pink-400 mix-blend-multiply blur-xl animate-blob"
            style={{ backgroundImage: 'linear-gradient(225deg, #FFE29F 0%, #FFA99F 48%, #FF719A 100%)' }}
          />
          <div
            className="absolute inset-0 rounded-full bg-yellow-400 mix-blend-multiply blur-xl animate-blob animation-delay-2000"
            style={{ backgroundImage: 'linear-gradient(90deg, hsla(29, 92%, 70%, 1) 0%, hsla(0, 87%, 73%, 1) 100%)' }}
          />
          <div
            className="absolute inset-0 rounded-full bg-purple-400 mix-blend-multiply blur-xl animate-blob animation-delay-4000"
            style={{ backgroundImage: 'linear-gradient(102.3deg, rgba(147,39,143,1) 5.9%, rgba(234,172,232,1) 64%, rgba(246,219,245,1) 89%)' }}
          />
        </div>
      </div>

      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2">
            Exam Seating Arrangement System
          </h1>
          <p className="text-gray-600 text-sm">Sign in to manage seating arrangements</p>
        </div>

        <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="animate-slideIn">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className={`bg-white/50 backdrop-blur-sm transition-colors focus:bg-white ${
                      emailError ? "border-red-500" : ""
                    }`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/50 backdrop-blur-sm transition-colors focus:bg-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="animate-slideIn">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className={`bg-white/50 backdrop-blur-sm transition-colors focus:bg-white ${
                      emailError ? "border-red-500" : ""
                    }`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/50 backdrop-blur-sm transition-colors focus:bg-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing up...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
