import "./App.css";
import Pages from "@/pages/index.jsx";
import { Toaster } from "@/components/ui/toaster";
import { Base44AuthProvider } from "@/components/providers/Base44AuthProvider";

function App() {
  return (
    <Base44AuthProvider>
      <Pages />
      <Toaster />
    </Base44AuthProvider>
  );
}

export default App;
