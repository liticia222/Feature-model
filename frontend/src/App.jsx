import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Menu,ArrowDownToLine,Plus, 
  Trash2, 
  FileUp, 
  FileDown} from "lucide-react"


function App() {
  return (
    <div class="grid grid-cols-4 gap-4 auto-rows-min p-4">

  <div class="col-span-1 flex justify-start">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button/>}>
        <Menu/>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Feature model</DropdownMenuLabel>
          <DropdownMenuItem>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouveau</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Trash2 className="mr-2 h-4 w-4"/>
            <span>Supprimer</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileUp className="mr-2 h-4 w-4" />
            <span>Importer</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Exporter</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div class="col-span-1 flex justify-end">
    <Button>
      Création
    </Button>
  </div>

  <div class="col-span-1 flex justify-start">
    <Button>
      Configuration
    </Button>
  </div>

  <div class="col-span-1 flex justify-end">
    <Button>
      <ArrowDownToLine />
    </Button>
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