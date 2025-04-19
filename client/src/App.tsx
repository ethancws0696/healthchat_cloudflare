import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Widget from "@/pages/widget/Widget";
import WidgetDemo from "@/pages/WidgetDemo";
import EmbedCode from "@/pages/EmbedCode";
import { AuthProvider } from "@/context/AuthContext";

// Regular router with all application routes
function RegularRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard/:tab?" component={Dashboard} />
      <Route path="/widget/:userId" component={Widget} />
      <Route path="/widget-demo" component={WidgetDemo} />
      <Route path="/embed-code" component={EmbedCode} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Widget-only router that only allows the Widget component
function WidgetRouter() {
  const [location] = useLocation();
  
  // Extract userId from the URL path
  const match = location.match(/\/widget\/(\d+)/);
  const userId = match ? match[1] : "1"; // Default to userId=1 if not found
  
  // In widget mode, always render the Widget component
  return <Widget userId={Number(userId)} isIframe={true} />;
}

interface AppProps {
  isWidgetMode?: boolean;
}

function App({ isWidgetMode = false }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isWidgetMode ? <WidgetRouter /> : <RegularRouter />}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
