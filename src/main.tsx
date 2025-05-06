import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// import "./index.css";
import "./globals.css";
import "./styles/hide-horizontal-scrollbar.css"; // Import the CSS to hide horizontal scrollbars
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
