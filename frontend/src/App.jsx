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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useDraggable } from "@dnd-kit/react";

function Draggable(){
  const { ref } = useDraggable({
    id: "draggable",
  });

  return (
    <Button ref={ref}>
      Draggable
    </Button>
  );
}

function App() {
  return (
    <div className="grid grid-cols-4 gap-4 auto-rows-min p-4">

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
        <Button>
          Bouton 1
        </Button>
      </div>

      <div className="col-span-1">
        <button className="float-right bg-blue-500 text-white px-4 py-2 rounded">
          Bouton 2
        </button>
      </div>

      <div className="col-span-1">
        <button className="float-left bg-blue-500 text-white px-4 py-2 rounded">
          Bouton 3
        </button>
      </div>

      <div className="col-span-1">
        <button className="float-right bg-blue-500 text-white px-4 py-2 rounded">
          Bouton 4
        </button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="col-span-4 row-span-2">
        <ResizablePanel defaultSize={25}>
            <Draggable />

        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <div>
            <p>Bloc vertical (cases 6–8)</p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>





    </div>

  )
}

export default App