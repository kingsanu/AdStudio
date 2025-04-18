import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Layout, ImageIcon, Text } from "lucide-react";

export default function HomePage() {
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const features = [
    {
      id: 1,
      title: "Professional Templates",
      description: "Choose from hundreds of professionally designed templates",
      icon: <Layout className="h-6 w-6" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: 2,
      title: "Easy Image Editing",
      description: "Upload your images or choose from our library",
      icon: <ImageIcon className="h-6 w-6" />,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: 3,
      title: "Text Customization",
      description: "Add and customize text with various fonts and styles",
      icon: <Text className="h-6 w-6" />,
      color: "from-green-500 to-teal-600",
    },
    {
      id: 4,
      title: "AI-Powered Design",
      description: "Get design suggestions powered by artificial intelligence",
      icon: <Sparkles className="h-6 w-6" />,
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-[#0070f3]/10" />
          <div className="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[#0070f3]/5" />
          <div className="absolute top-[20%] left-[30%] h-[200px] w-[200px] rounded-full bg-[#7928ca]/5" />
        </div>

        {/* Navigation */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-[#0070f3]"></div>
              <span className="text-xl font-bold text-neutral-900 dark:text-white">
                Ads Studio
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-[#0070f3] hover:bg-[#0060d3]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-6xl"
            >
              Create stunning{" "}
              <span className="bg-gradient-to-r from-[#0070f3] to-[#7928ca] bg-clip-text text-transparent">
                designs
              </span>{" "}
              in minutes
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-10 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300"
            >
              The all-in-one design platform for creating beautiful graphics,
              social media posts, and marketing materials. No design experience
              needed.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
            >
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="bg-[#0070f3] hover:bg-[#0060d3] px-8"
                >
                  Start Designing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/editor">
                <Button size="lg" variant="outline">
                  Try the Editor
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Preview Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="container mx-auto px-4 py-8"
        >
          <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-xl dark:border-neutral-800">
            <img
              src="/dashboard-preview.png"
              alt="Dashboard Preview"
              className="w-full"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/1200x600/0070f3/FFFFFF/png?text=Dashboard+Preview";
              }}
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white md:text-4xl">
            Powerful Features
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-600 dark:text-neutral-300">
            Everything you need to create stunning designs for your business
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setIsHovered(feature.id)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <Card
                className={`h-full overflow-hidden transition-all duration-300 ${
                  isHovered === feature.id
                    ? "shadow-lg dark:shadow-neutral-800/20"
                    : "shadow-md"
                }`}
              >
                <CardContent className="p-6">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} text-white`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0070f3]/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-6 text-3xl font-bold text-neutral-900 dark:text-white md:text-4xl">
              Ready to create amazing designs?
            </h2>
            <p className="mb-8 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
              Join thousands of users who are already creating stunning designs
              with our platform.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[#0070f3] hover:bg-[#0060d3] px-8"
              >
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between space-y-6 md:flex-row md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-md bg-[#0070f3]"></div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                Ads Studio
              </span>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-sm text-neutral-600 hover:text-[#0070f3] dark:text-neutral-300"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-neutral-600 hover:text-[#0070f3] dark:text-neutral-300"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-neutral-600 hover:text-[#0070f3] dark:text-neutral-300"
              >
                Contact
              </a>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} FoodyQueen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
