
import React, { useState } from 'react';
import PipelineSidebar from '@/components/PipelineSidebar';
import PipelineCanvas from '@/components/PipelineCanvas';
import PipelineBlockConfig from '@/components/PipelineBlockConfig';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<"github" | "jenkins">("github");
  
  // Handle drag start from sidebar to canvas
  const handleDragStart = (event: React.DragEvent, blockType: string, category: string) => {
    event.dataTransfer.setData('blockType', blockType);
    event.dataTransfer.setData('category', category);
  };
  
  // Handle block selection
  const handleSelectBlock = (block: any) => {
    setSelectedBlock(block);
  };
  
  // Handle block configuration update
  const handleUpdateBlock = (updatedBlock: any) => {
    setSelectedBlock(updatedBlock);
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PipelineSidebar onDragStart={handleDragStart} />
        
        <main className="flex-1 flex flex-col">
          <header className="border-b p-4">
            <h1 className="text-2xl font-bold">CI/CD Pipeline Designer</h1>
            <p className="text-muted-foreground">
              Design your workflow, then export it as YAML for GitHub Actions or Jenkins
            </p>
            
            <Tabs 
              value={exportFormat} 
              onValueChange={(value) => setExportFormat(value as "github" | "jenkins")}
              className="mt-4"
            >
              <TabsList>
                <TabsTrigger value="github">GitHub Actions</TabsTrigger>
                <TabsTrigger value="jenkins">Jenkins</TabsTrigger>
              </TabsList>
            </Tabs>
          </header>
          
          <div className="flex-1 flex">
            <div className="flex-1 overflow-hidden">
              <PipelineCanvas 
                onSelectBlock={handleSelectBlock} 
                selectedBlock={selectedBlock}
                exportFormat={exportFormat}
              />
            </div>
            
            <div className="w-80 border-l">
              <PipelineBlockConfig 
                block={selectedBlock} 
                onUpdateBlock={handleUpdateBlock} 
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
