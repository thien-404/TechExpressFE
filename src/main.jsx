import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// Redux
import { Provider } from "react-redux";
import store from "./store/store.js";
// tanstack query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./store/authContext.jsx";

import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.TechExpress_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </Provider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
