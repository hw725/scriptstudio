import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
// import { Base44AuthProvider } from "@/components/providers/Base44AuthProvider"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App
