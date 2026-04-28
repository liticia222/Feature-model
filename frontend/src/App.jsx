import Sidebar from "@/components/ui/Sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import Toolbar from "./components/ui/Toolbar";



function App() {
  return (
    <div className="grid grid-cols-4 gap-4 auto-rows-min p-4">
      <Toolbar />
      <ResizablePanelGroup direction="horizontal" className="col-span-4 row-span-2">
        <ResizablePanel defaultSize={25}>
          <Sidebar />
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