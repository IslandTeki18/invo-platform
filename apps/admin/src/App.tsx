import { useAuth } from "@clerk/clerk-react";
import { AppRoutes } from "./routes/router";

function AuthLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      Loading...
    </div>
  );
}

export function App() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <AuthLoading />;
  }

  return <AppRoutes />;
}

