import AppRoutes from "./routes/AppRoutes";
import { GoogleOAuthProvider } from "@react-oauth/google";

import GlobalBackground from "./components/ui/GlobalBackground";

function App() {
  return (
    <GoogleOAuthProvider clientId="119132632430-icf95e81vqbqr15ic1pknnglkdf4v3b2.apps.googleusercontent.com">
      <GlobalBackground />
      <AppRoutes />
    </GoogleOAuthProvider>
  );
}

export default App;
