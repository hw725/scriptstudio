import "./App.css";
import Pages from "@/pages/index.jsx";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";

function App() {
  return (
    <SupabaseAuthProvider>
      <Pages />
      <Toaster />
    </SupabaseAuthProvider>
  );
}

export default App;
