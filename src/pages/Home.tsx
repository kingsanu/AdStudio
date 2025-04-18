import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle,
  Layout,
  Layers,
  Palette,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            transition={{ duration: 1 }}
            className="absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-[#0070f3]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[#0070f3]"
          />
        </div>

        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3]" />
            <span className="font-bold text-xl">Ads Studio</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild className="bg-[#0070f3] hover:bg-[#0060d3]">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild className="bg-[#0070f3] hover:bg-[#0060d3]">
                  <Link to="/auth">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Create stunning designs with{" "}
              <span className="text-[#0070f3]">Ads Studio</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-neutral-600 dark:text-neutral-300 mb-8"
            >
              The all-in-one platform for creating beautiful designs, social
              media posts, and marketing materials - no design skills required.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                asChild
                size="lg"
                className="bg-[#0070f3] hover:bg-[#0060d3]"
              >
                <Link to={user ? "/dashboard" : "/auth"} className="flex gap-2">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Learn More</a>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Preview Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative mx-auto max-w-6xl px-4 pb-20"
        >
          <div className="rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <img
              src="/dashboard-preview.png"
              alt="Dashboard Preview"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/1200x675?text=Dashboard+Preview";
              }}
            />
          </div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-neutral-50 dark:bg-neutral-800"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Everything you need to create professional designs in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-md"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <Layout className="h-6 w-6 text-[#0070f3]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ready-made Templates</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Choose from hundreds of professionally designed templates for
                social media, marketing, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-md"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Drag-and-Drop Editor</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Easily customize designs with our intuitive drag-and-drop
                editor. No design skills needed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-md"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-6">
                <Layers className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Asset Library</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Access millions of stock photos, illustrations, icons, and fonts
                to enhance your designs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-md"
            >
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Tools</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Generate content, remove backgrounds, and get design suggestions
                with our AI-powered tools.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-md"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">One-Click Export</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Export your designs in multiple formats with just one click.
                Perfect for any platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-md"
            >
              <div className="w-12 h-12 bg-[#0070f3]/10 rounded-lg flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-[#0070f3]"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M7 10h10" />
                  <path d="M7 14h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Work together with your team in real-time. Share, comment, and
                edit designs collaboratively.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-[#0070f3]/10 dark:bg-[#0070f3]/20 rounded-2xl p-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Ready to create amazing designs?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-neutral-600 dark:text-neutral-300 mb-8"
            >
              Join thousands of users who are creating stunning designs every
              day
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Button
                asChild
                size="lg"
                className="bg-[#0070f3] hover:bg-[#0060d3]"
              >
                <Link to={user ? "/dashboard" : "/auth"}>
                  Get Started for Free
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-100 dark:bg-neutral-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="h-8 w-8 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3]" />
              <span className="font-bold text-xl">Ads Studio</span>
            </div>
            <div className="flex gap-8">
              <Link
                to="#"
                className="text-neutral-600 dark:text-neutral-300 hover:text-[#0070f3] dark:hover:text-[#0070f3]"
              >
                About
              </Link>
              <Link
                to="#"
                className="text-neutral-600 dark:text-neutral-300 hover:text-[#0070f3] dark:hover:text-[#0070f3]"
              >
                Features
              </Link>
              <Link
                to="#"
                className="text-neutral-600 dark:text-neutral-300 hover:text-[#0070f3] dark:hover:text-[#0070f3]"
              >
                Pricing
              </Link>
              <Link
                to="#"
                className="text-neutral-600 dark:text-neutral-300 hover:text-[#0070f3] dark:hover:text-[#0070f3]"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700 mt-8 pt-8 text-center text-neutral-500">
            <p>© {new Date().getFullYear()} Ads Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
