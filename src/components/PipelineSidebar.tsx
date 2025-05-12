
import React from 'react';
import { 
  GitBranch, 
  Package, 
  Server, 
  Cpu, 
  TestTube, 
  Webhook, 
  CloudCog,
  Database,
  Bug,
  Bell,
  ShieldCheck,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';

// Define our block categories and items
const blockCategories = [
  {
    id: 'source',
    label: 'Source Control',
    color: 'pipeline-source',
    blocks: [
      { id: 'git-clone', icon: GitBranch, name: 'Git Clone', description: 'Clone a Git repository' },
      { id: 'github-checkout', icon: GitBranch, name: 'GitHub Checkout', description: 'Checkout code from GitHub' }
    ]
  },
  {
    id: 'build',
    label: 'Build',
    color: 'pipeline-build',
    blocks: [
      { id: 'docker-build', icon: Package, name: 'Docker Build', description: 'Build a Docker image' },
      { id: 'npm-build', icon: Package, name: 'NPM Build', description: 'Build with npm' },
      { id: 'maven-build', icon: Package, name: 'Maven Build', description: 'Build with Maven' }
    ]
  },
  {
    id: 'test',
    label: 'Test',
    color: 'pipeline-test',
    blocks: [
      { id: 'unit-test', icon: TestTube, name: 'Unit Test', description: 'Run unit tests' },
      { id: 'integration-test', icon: TestTube, name: 'Integration Test', description: 'Run integration tests' },
      { id: 'security-scan', icon: ShieldCheck, name: 'Security Scan', description: 'Scan for security vulnerabilities' }
    ]
  },
  {
    id: 'deploy',
    label: 'Deploy',
    color: 'pipeline-deploy',
    blocks: [
      { id: 'k8s-deploy', icon: Server, name: 'Kubernetes Deploy', description: 'Deploy to Kubernetes' },
      { id: 'aws-deploy', icon: CloudCog, name: 'AWS Deploy', description: 'Deploy to AWS' },
      { id: 'azure-deploy', icon: CloudCog, name: 'Azure Deploy', description: 'Deploy to Azure' }
    ]
  },
  {
    id: 'utility',
    label: 'Utilities',
    color: 'pipeline-utility',
    blocks: [
      { id: 'notification', icon: Bell, name: 'Notification', description: 'Send notifications' },
      { id: 'webhook', icon: Webhook, name: 'Webhook', description: 'Trigger a webhook' },
      { id: 'artifact', icon: Archive, name: 'Artifact', description: 'Create artifact' }
    ]
  }
];

interface PipelineSidebarProps {
  onDragStart: (event: React.DragEvent, blockType: string, category: string) => void;
}

const PipelineSidebar = ({ onDragStart }: PipelineSidebarProps) => {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="px-4 py-2">
        <h2 className="text-lg font-semibold">Block Library</h2>
        <p className="text-sm text-muted-foreground">Drag blocks to the canvas</p>
      </SidebarHeader>
      
      <SidebarContent className="px-1">
        {blockCategories.map((category) => (
          <SidebarGroup key={category.id}>
            <SidebarGroupLabel className="px-3">
              {category.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1 px-1">
                {category.blocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, block.id, category.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-grab",
                      `hover:bg-${category.color}/10 border-l-2 border-${category.color}`,
                      "transition-colors"
                    )}
                  >
                    <block.icon className={cn("h-4 w-4", `text-${category.color}`)} />
                    <div>
                      <p className="font-medium">{block.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{block.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default PipelineSidebar;
