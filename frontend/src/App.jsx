import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Button onClick={() => console.log("Ça marche !")}>
        Mon bouton shadcn
      </Button>
    </div>
  )
}

export default App