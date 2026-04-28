import { Button } from "@/components/ui/button"

function App() {
  return (
    <div class="grid grid-cols-4 gap-4 auto-rows-min p-4">

  <div class="col-span-1">
    <Button>
      Bouton 1
    </Button>
  </div>

  <div class="col-span-1">
    <button class="float-right bg-blue-500 text-white px-4 py-2 rounded">
      Bouton 2
    </button>
  </div>

  <div class="col-span-1">
    <button class="float-left bg-blue-500 text-white px-4 py-2 rounded">
      Bouton 3
    </button>
  </div>

  <div class="col-span-1">
    <button class="float-right bg-blue-500 text-white px-4 py-2 rounded">
      Bouton 4
    </button>
  </div>

  <div class="col-span-1">
    <p>Bloc vertical (case 5)</p>
  </div>

  <div class="col-span-3 row-span-3 bg-gray-300 p-4 rounded">
    <p>Bloc vertical (cases 6–8)</p>
  </div>

</div>

  )
}

export default App