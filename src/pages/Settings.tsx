import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Download, Globe, Moon, Palette, Shield, Sun } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
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
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2 mt-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="#appearance">
                        <Palette className="mr-2 h-4 w-4" />
                        Appearance
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="#notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="#privacy">
                        <Shield className="mr-2 h-4 w-4" />
                        Privacy & Security
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="#language">
                        <Globe className="mr-2 h-4 w-4" />
                        Language & Region
                      </Link>
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="mb-8" id="appearance">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the application looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <p className="text-sm text-neutral-500">
                      Select your preferred theme
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex flex-col items-center gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12">
                          <Sun className="h-6 w-6" />
                        </Button>
                        <span className="text-sm">Light</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12">
                          <Moon className="h-6 w-6" />
                        </Button>
                        <span className="text-sm">Dark</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12">
                          <div className="flex">
                            <Sun className="h-6 w-6 mr-[-4px]" />
                            <Moon className="h-6 w-6" />
                          </div>
                        </Button>
                        <span className="text-sm">System</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Color Scheme</h3>
                    <p className="text-sm text-neutral-500">
                      Choose your preferred color scheme
                    </p>
                    <Tabs defaultValue="blue">
                      <TabsList>
                        <TabsTrigger value="blue">Blue</TabsTrigger>
                        <TabsTrigger value="purple">Purple</TabsTrigger>
                        <TabsTrigger value="green">Green</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8" id="notifications">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-neutral-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch id="email-notifications" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Push Notifications</h3>
                        <p className="text-sm text-neutral-500">
                          Receive notifications in the browser
                        </p>
                      </div>
                      <Switch id="push-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Marketing Emails</h3>
                        <p className="text-sm text-neutral-500">
                          Receive marketing and promotional emails
                        </p>
                      </div>
                      <Switch id="marketing-emails" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8" id="privacy">
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>
                    Manage your privacy and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-neutral-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">Enable</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Data Sharing</h3>
                        <p className="text-sm text-neutral-500">
                          Allow us to use your data to improve our services
                        </p>
                      </div>
                      <Switch id="data-sharing" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Download Your Data</h3>
                      <p className="text-sm text-neutral-500">
                        Download a copy of your data
                      </p>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8" id="language">
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>
                    Set your preferred language and region
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select defaultValue="us">
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="eu">Europe</SelectItem>
                          <SelectItem value="asia">Asia</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  className="bg-[#0070f3] hover:bg-[#0060d3]"
                  onClick={handleSave}
                >
                  Save Settings
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
