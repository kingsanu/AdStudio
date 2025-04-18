import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-neutral-900">
      <div className="container flex flex-col items-center justify-center px-5 text-center">
        <h1 className="mb-4 text-9xl font-bold text-[#0070f3]">404</h1>
        <h2 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white md:text-4xl">
          Page Not Found
        </h2>
        <p className="mb-8 max-w-md text-neutral-600 dark:text-neutral-300">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex space-x-4">
          <Link to="/">
            <Button className="bg-[#0070f3] hover:bg-[#0060d3]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
