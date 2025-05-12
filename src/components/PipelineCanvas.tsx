import React, { useState, useRef, useEffect } from 'react';
import { 
  GitBranch, 
  Package, 
  Server, 
  Cpu, 
  TestTube, 
  Webhook, 
  CloudCog, 
  X,
  ChevronRight,
  AlertCircle,
  Bell,
  Archive,
  Move
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define types for our pipeline blocks
interface PipelineBlock {
  id: string;
  type: string;
  category: string;
  x: number;
  y: number;
  config: Record<string, string>;
  isConfigured: boolean;
}

interface Connection {
  id: string;
  source: string;
  target: string;
}

// Map block types to icons
const blockIconMap: Record<string, any> = {
  'git-clone': GitBranch,
  'github-checkout': GitBranch,
  'docker-build': Package,
  'npm-build': Package,
  'maven-build': Package,
  'unit-test': TestTube,
  'integration-test': TestTube,
  'security-scan': TestTube,
  'k8s-deploy': Server,
  'aws-deploy': CloudCog,
  'azure-deploy': CloudCog,
  'notification': Bell,
  'webhook': Webhook,
  'artifact': Archive,
};

// Category color mapping
const categoryColors: Record<string, string> = {
  'source': 'bg-pipeline-source',
  'build': 'bg-pipeline-build',
  'test': 'bg-pipeline-test',
  'deploy': 'bg-pipeline-deploy',
  'utility': 'bg-pipeline-utility',
};

interface PipelineCanvasProps {
  onSelectBlock: (block: PipelineBlock | null) => void;
  selectedBlock: PipelineBlock | null;
  exportFormat: "github" | "jenkins";
}

const PipelineCanvas = ({ onSelectBlock, selectedBlock, exportFormat }: PipelineCanvasProps) => {
  const [blocks, setBlocks] = useState<PipelineBlock[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ id: string, x: number, y: number } | null>(null);
  const [connectionEnd, setConnectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [generatedYaml, setGeneratedYaml] = useState<string>('');
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridSize = 20; // Grid size for snapping

  // Handle block drop from sidebar
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const blockType = e.dataTransfer.getData('blockType');
    const category = e.dataTransfer.getData('category');
    
    if (!blockType || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - canvasRect.left;
    let y = e.clientY - canvasRect.top;
    
    // Snap to grid
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;
    
    // Create new block
    const newBlock: PipelineBlock = {
      id: `block-${Date.now()}`,
      type: blockType,
      category,
      x,
      y,
      config: {},
      isConfigured: false,
    };
    
    setBlocks([...blocks, newBlock]);
    onSelectBlock(newBlock); // Select the newly created block
    
    toast.success(`Added ${blockType} block`);
  };
  
  // Handle drag over to allow dropping
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // If we're dragging a block within the canvas, update its position
    if (isDragging && draggedBlock && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - canvasRect.left - dragOffset.x;
      let y = e.clientY - canvasRect.top - dragOffset.y;
      
      // Snap to grid
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
      
      setBlocks(blocks.map(block => 
        block.id === draggedBlock 
          ? { ...block, x, y } 
          : block
      ));
    }
  };
  
  // Handle block selection
  const selectBlock = (block: PipelineBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDrawingConnection) {
      // If we're drawing a connection, this is the target
      if (connectionStart && connectionStart.id !== block.id) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          source: connectionStart.id,
          target: block.id,
        };
        
        setConnections([...connections, newConnection]);
        setIsDrawingConnection(false);
        setConnectionStart(null);
        setConnectionEnd(null);
        
        toast.success('Connection created');
      }
    } else {
      onSelectBlock(block);
    }
  };
  
  // Start block drag
  const startBlockDrag = (block: PipelineBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Set offset to maintain position relative to where user clicked on the block
    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    
    setIsDragging(true);
    setDraggedBlock(block.id);
    setDragOffset({ x: offsetX, y: offsetY });
  };
  
  // End block drag
  const endBlockDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedBlock(null);
      toast.success('Block position updated');
    }
  };
  
  // Start drawing a connection from a block
  const startConnection = (block: PipelineBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = block.x + 120; // Rightmost point of block
      const y = block.y + 40; // Middle of block
      
      setIsDrawingConnection(true);
      setConnectionStart({ id: block.id, x, y });
      setConnectionEnd({ x, y });
    }
  };
  
  // Update connection line while drawing
  const updateConnection = (e: React.MouseEvent) => {
    if (isDrawingConnection && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setConnectionEnd({
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
      });
    }
  };
  
  // Cancel connection drawing when clicking on canvas
  const cancelConnection = () => {
    if (isDrawingConnection) {
      setIsDrawingConnection(false);
      setConnectionStart(null);
      setConnectionEnd(null);
    }
    
    // Also handle ending block drag here
    endBlockDrag();
    
    // Deselect block only if no drag operation was in progress
    if (!isDragging) {
      onSelectBlock(null);
    }
  };
  
  // Delete a block and its connections
  const deleteBlock = (blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If this is the selected block, deselect it
    if (selectedBlock && selectedBlock.id === blockId) {
      onSelectBlock(null);
    }
    
    // Filter out the block
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    
    // Filter out connections involving this block
    const updatedConnections = connections.filter(
      conn => conn.source !== blockId && conn.target !== blockId
    );
    
    setBlocks(updatedBlocks);
    setConnections(updatedConnections);
    
    toast.info('Block deleted');
  };
  
  // Delete a connection
  const deleteConnection = (connId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnections(connections.filter(conn => conn.id !== connId));
    toast.info('Connection deleted');
  };
  
  // Generate YAML based on the pipeline design
  const generateYaml = () => {
    if (blocks.length === 0) {
      toast.error('Pipeline is empty');
      return;
    }
    
    // Check if all blocks are configured
    const unconfiguredBlocks = blocks.filter(block => !block.isConfigured);
    if (unconfiguredBlocks.length > 0) {
      toast.error('Some blocks are not configured');
      return;
    }
    
    // Generate YAML based on export format
    let yaml = '';
    
    if (exportFormat === "github") {
      yaml = generateGitHubActionsYaml();
    } else {
      yaml = generateJenkinsfileYaml();
    }
    
    setGeneratedYaml(yaml);
    setShowYamlModal(true);
  };
  
  // Generate GitHub Actions workflow YAML
  const generateGitHubActionsYaml = (): string => {
    let yaml = `name: CI/CD Pipeline\n\non:\n  push:\n    branches: [ main ]\n  pull_request:\n    branches: [ main ]\n\njobs:\n  build-and-deploy:\n    runs-on: ubuntu-latest\n    steps:\n`;
    
    // Analyze connections to determine execution order
    const blockOrder: string[] = [];
    const visited = new Set<string>();
    
    // Find starting blocks (those without incoming connections)
    const blockWithIncoming = new Set(connections.map(conn => conn.target));
    const startingBlocks = blocks
      .filter(block => !blockWithIncoming.has(block.id))
      .map(block => block.id);
    
    // Simple BFS to determine execution order
    const queue = [...startingBlocks];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      blockOrder.push(currentId);
      
      // Add outgoing connections to queue
      const outgoing = connections
        .filter(conn => conn.source === currentId)
        .map(conn => conn.target);
      queue.push(...outgoing);
    }
    
    // Add blocks in the determined order
    blockOrder.forEach((blockId, index) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      
      yaml += `      - name: ${getBlockName(block.type)}\n`;
      
      switch (block.type) {
        case 'git-clone':
        case 'github-checkout':
          yaml += `        uses: actions/checkout@v3\n`;
          yaml += `        with:\n`;
          yaml += `          repository: ${block.config.repository || 'owner/repo'}\n`;
          yaml += `          ref: ${block.config.branch || 'main'}\n\n`;
          break;
          
        case 'docker-build':
          yaml += `        uses: docker/build-push-action@v2\n`;
          yaml += `        with:\n`;
          yaml += `          context: .\n`;
          yaml += `          file: ${block.config.dockerfile || 'Dockerfile'}\n`;
          yaml += `          tags: ${block.config.tags || 'myimage:latest'}\n\n`;
          break;
          
        case 'npm-build':
          yaml += `        run: |\n`;
          yaml += `          npm ci\n`;
          yaml += `          npm run build\n\n`;
          break;
          
        case 'k8s-deploy':
          yaml += `        uses: Azure/k8s-deploy@v1\n`;
          yaml += `        with:\n`;
          yaml += `          manifests: ${block.config.manifests || 'k8s/*.yml'}\n`;
          yaml += `          namespace: ${block.config.namespace || 'default'}\n\n`;
          break;
          
        default:
          yaml += `        run: echo "Running ${getBlockName(block.type)}"\n\n`;
      }
    });
    
    return yaml;
  };
  
  // Generate Jenkinsfile YAML
  const generateJenkinsfileYaml = (): string => {
    let yaml = `pipeline {\n  agent any\n\n  stages {\n`;
    
    // Similar ordering logic as GitHub Actions
    const blockOrder: string[] = [];
    const visited = new Set<string>();
    
    const blockWithIncoming = new Set(connections.map(conn => conn.target));
    const startingBlocks = blocks
      .filter(block => !blockWithIncoming.has(block.id))
      .map(block => block.id);
    
    const queue = [...startingBlocks];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      blockOrder.push(currentId);
      
      const outgoing = connections
        .filter(conn => conn.source === currentId)
        .map(conn => conn.target);
      queue.push(...outgoing);
    }
    
    // Add stages in the determined order
    blockOrder.forEach((blockId) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      
      yaml += `    stage('${getBlockName(block.type)}') {\n`;
      yaml += `      steps {\n`;
      
      switch (block.type) {
        case 'git-clone':
        case 'github-checkout':
          yaml += `        git branch: '${block.config.branch || 'main'}',\n`;
          yaml += `            url: '${block.config.repository || 'https://github.com/owner/repo.git'}'\n`;
          break;
          
        case 'docker-build':
          yaml += `        sh 'docker build -t ${block.config.tags || 'myimage:latest'} -f ${block.config.dockerfile || 'Dockerfile'} .'\n`;
          break;
          
        case 'npm-build':
          yaml += `        sh 'npm ci && npm run build'\n`;
          break;
          
        case 'k8s-deploy':
          yaml += `        sh 'kubectl apply -f ${block.config.manifests || 'k8s/*.yml'} -n ${block.config.namespace || 'default'}'\n`;
          break;
          
        default:
          yaml += `        echo "Running ${getBlockName(block.type)}"\n`;
      }
      
      yaml += `      }\n    }\n\n`;
    });
    
    yaml += `  }\n}\n`;
    return yaml;
  };
  
  // Helper to get display name from block type
  const getBlockName = (blockType: string): string => {
    const names: Record<string, string> = {
      'git-clone': 'Git Clone',
      'github-checkout': 'GitHub Checkout',
      'docker-build': 'Docker Build',
      'npm-build': 'NPM Build',
      'maven-build': 'Maven Build',
      'k8s-deploy': 'Kubernetes Deploy',
      'aws-deploy': 'AWS Deploy',
      'azure-deploy': 'Azure Deploy',
      'unit-test': 'Run Unit Tests',
      'integration-test': 'Run Integration Tests',
      'security-scan': 'Security Scan',
      'notification': 'Send Notification',
      'webhook': 'Trigger Webhook',
      'artifact': 'Create Artifact',
    };
    
    return names[blockType] || blockType;
  };
  
  // Copy YAML to clipboard
  const copyYaml = () => {
    navigator.clipboard.writeText(generatedYaml);
    toast.success('YAML copied to clipboard');
  };
  
  // Download YAML as file
  const downloadYaml = () => {
    const filename = exportFormat === 'github' ? 'workflow.yml' : 'Jenkinsfile';
    const blob = new Blob([generatedYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // Update block configuration
  useEffect(() => {
    if (selectedBlock) {
      setBlocks(blocks.map(block => 
        block.id === selectedBlock.id ? selectedBlock : block
      ));
    }
  }, [selectedBlock]);
  
  // Draw connection lines
  const drawConnections = () => {
    return connections.map(conn => {
      const sourceBlock = blocks.find(block => block.id === conn.source);
      const targetBlock = blocks.find(block => block.id === conn.target);
      
      if (!sourceBlock || !targetBlock) return null;
      
      const startX = sourceBlock.x + 120; // Right edge of source
      const startY = sourceBlock.y + 40; // Middle of source
      const endX = targetBlock.x; // Left edge of target
      const endY = targetBlock.y + 40; // Middle of target
      
      const controlPointX = (startX + endX) / 2;
      
      const path = `M${startX},${startY} C${controlPointX},${startY} ${controlPointX},${endY} ${endX},${endY}`;
      
      return (
        <g key={conn.id} className="group">
          <path 
            d={path} 
            fill="none" 
            stroke="#64748b" 
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            className="transition-colors group-hover:stroke-primary"
          />
          <path 
            d={path} 
            fill="none" 
            stroke="transparent" 
            strokeWidth="10"
            onClick={(e) => deleteConnection(conn.id, e)}
            className="cursor-pointer"
          />
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="border-b p-2 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Pipeline Designer</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateYaml}
            disabled={blocks.length === 0}
          >
            Generate {exportFormat === 'github' ? 'GitHub Action' : 'Jenkinsfile'}
          </Button>
        </div>
      </div>
      
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto relative bg-slate-50"
        style={{ 
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)'
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={cancelConnection}
        onMouseMove={updateConnection}
        onMouseUp={endBlockDrag}
        onMouseLeave={endBlockDrag}
      >
        {/* SVG layer for connections */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
          
          {/* Existing connections */}
          {drawConnections()}
          
          {/* Connection being drawn */}
          {isDrawingConnection && connectionStart && connectionEnd && (
            <path
              d={`M${connectionStart.x},${connectionStart.y} C${(connectionStart.x + connectionEnd.x) / 2},${connectionStart.y} ${(connectionStart.x + connectionEnd.x) / 2},${connectionEnd.y} ${connectionEnd.x},${connectionEnd.y}`}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead)"
            />
          )}
        </svg>
        
        {/* Blocks */}
        {blocks.map(block => {
          const BlockIcon = blockIconMap[block.type] || Package;
          const isSelected = selectedBlock && selectedBlock.id === block.id;
          const categoryColor = categoryColors[block.category] || 'bg-gray-400';
          
          return (
            <div
              key={block.id}
              className={cn(
                "absolute w-[120px] p-2 rounded-md shadow-md",
                "border-2",
                isSelected ? "border-primary" : "border-transparent",
                "transition-all duration-200",
                block.isConfigured ? "bg-white" : "bg-amber-50"
              )}
              style={{
                left: `${block.x}px`,
                top: `${block.y}px`,
              }}
              onClick={(e) => selectBlock(block, e)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className={cn("w-2 h-2 rounded-full", categoryColor)} />
                <button
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  onClick={(e) => deleteBlock(block.id, e)}
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                <div 
                  className="cursor-move flex items-center justify-center mb-1"
                  onMouseDown={(e) => startBlockDrag(block, e)}
                >
                  <Move size={16} className="text-gray-500" />
                  <BlockIcon className="h-6 w-6 ml-1" />
                </div>
                <span className="text-xs font-medium text-center">
                  {getBlockName(block.type)}
                </span>
                
                {!block.isConfigured && (
                  <div className="flex items-center text-amber-500 text-[10px] mt-1">
                    <AlertCircle size={10} className="mr-1" />
                    <span>Needs config</span>
                  </div>
                )}
              </div>
              
              <button
                className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
                onClick={(e) => startConnection(block, e)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          );
        })}
        
        {/* YAML Modal */}
        {showYamlModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg w-3/4 max-w-3xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  {exportFormat === 'github' ? 'GitHub Actions Workflow' : 'Jenkinsfile'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowYamlModal(false)}>
                  <X size={16} />
                </Button>
              </div>
              
              <pre className="bg-slate-900 text-slate-50 p-4 overflow-auto flex-1 text-sm">
                {generatedYaml}
              </pre>
              
              <div className="p-4 border-t flex justify-end space-x-2">
                <Button variant="outline" onClick={copyYaml}>
                  Copy to Clipboard
                </Button>
                <Button onClick={downloadYaml}>
                  Download {exportFormat === 'github' ? 'workflow.yml' : 'Jenkinsfile'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineCanvas;
