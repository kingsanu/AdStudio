import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Edit, Save, User } from "lucide-react";

export default function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the updateUserProfile function with the form data
      const success = await updateUserProfile(formData);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link to="/dashboard" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4 relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={user?.logo || "https://github.com/shadcn.png"}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="text-xl">
                        {user?.name
                          ? user.name.substring(0, 2).toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full bg-white dark:bg-neutral-800"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle>{user?.name || "User"}</CardTitle>
                  <CardDescription>
                    {user?.email || user?.phoneNumber || ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-neutral-500" />
                      <span>Member since {new Date().getFullYear()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>
                        Manage your account details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={!isEditing}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={!isEditing}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                              id="phoneNumber"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>

                        {isEditing && (
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              className="bg-[#0070f3] hover:bg-[#0060d3]"
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage your password and security preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Password</h3>
                          <p className="text-sm text-neutral-500">
                            You can change your password or set one if you
                            logged in with a phone number
                          </p>
                          <Button variant="outline">Change Password</Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-neutral-500">
                            Add an extra layer of security to your account
                          </p>
                          <Button variant="outline">Enable 2FA</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>
                        Customize your experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Notifications</h3>
                          <p className="text-sm text-neutral-500">
                            Manage how you receive notifications
                          </p>
                          <Button variant="outline">
                            Notification Settings
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Appearance</h3>
                          <p className="text-sm text-neutral-500">
                            Customize the look and feel of the application
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline">Light</Button>
                            <Button variant="outline">Dark</Button>
                            <Button variant="outline">System</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
