
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Configuration fields for different block types
const configFields: Record<string, Array<{ name: string, label: string, placeholder: string }>> = {
  'git-clone': [
    { name: 'repository', label: 'Repository URL', placeholder: 'https://github.com/username/repo.git' },
    { name: 'branch', label: 'Branch', placeholder: 'main' },
  ],
  'github-checkout': [
    { name: 'repository', label: 'Repository', placeholder: 'username/repo' },
    { name: 'branch', label: 'Branch', placeholder: 'main' },
  ],
  'docker-build': [
    { name: 'dockerfile', label: 'Dockerfile Path', placeholder: 'Dockerfile' },
    { name: 'tags', label: 'Image Tags', placeholder: 'myimage:latest' },
  ],
  'npm-build': [
    { name: 'workingDirectory', label: 'Working Directory', placeholder: '.' },
    { name: 'command', label: 'Build Command', placeholder: 'npm run build' },
  ],
  'maven-build': [
    { name: 'goals', label: 'Maven Goals', placeholder: 'clean install' },
    { name: 'options', label: 'Maven Options', placeholder: '-DskipTests' },
  ],
  'unit-test': [
    { name: 'command', label: 'Test Command', placeholder: 'npm test' },
    { name: 'testPath', label: 'Test Path', placeholder: 'tests/' },
  ],
  'integration-test': [
    { name: 'command', label: 'Integration Test Command', placeholder: 'npm run test:integration' },
    { name: 'testPath', label: 'Test Path', placeholder: 'integration-tests/' },
  ],
  'security-scan': [
    { name: 'scanType', label: 'Scan Type', placeholder: 'dependency' },
    { name: 'scanPath', label: 'Scan Path', placeholder: '.' },
  ],
  'k8s-deploy': [
    { name: 'manifests', label: 'Manifests Path', placeholder: 'k8s/*.yml' },
    { name: 'namespace', label: 'Namespace', placeholder: 'default' },
    { name: 'cluster', label: 'Cluster Name', placeholder: 'production' },
  ],
  'aws-deploy': [
    { name: 'service', label: 'AWS Service', placeholder: 'ECS' },
    { name: 'region', label: 'AWS Region', placeholder: 'us-west-2' },
    { name: 'config', label: 'Config Path', placeholder: 'aws/config.json' },
  ],
  'azure-deploy': [
    { name: 'service', label: 'Azure Service', placeholder: 'App Service' },
    { name: 'resourceGroup', label: 'Resource Group', placeholder: 'my-resource-group' },
    { name: 'appName', label: 'App Name', placeholder: 'my-app' },
  ],
  'notification': [
    { name: 'type', label: 'Notification Type', placeholder: 'slack' },
    { name: 'recipient', label: 'Recipient', placeholder: '#channel or email' },
    { name: 'message', label: 'Message Template', placeholder: 'Deployment completed' },
  ],
  'webhook': [
    { name: 'url', label: 'Webhook URL', placeholder: 'https://example.com/webhook' },
    { name: 'method', label: 'HTTP Method', placeholder: 'POST' },
    { name: 'body', label: 'Request Body', placeholder: '{"status": "success"}' },
  ],
  'artifact': [
    { name: 'path', label: 'Artifact Path', placeholder: 'build/' },
    { name: 'name', label: 'Artifact Name', placeholder: 'app-bundle' },
  ],
};

// Default placeholder for unknown block types
const defaultFields = [
  { name: 'name', label: 'Name', placeholder: 'My Block' },
  { name: 'description', label: 'Description', placeholder: 'Block description' },
];

interface PipelineBlockConfigProps {
  block: {
    id: string;
    type: string;
    category: string;
    config: Record<string, string>;
    isConfigured: boolean;
  } | null;
  onUpdateBlock: (updatedBlock: any) => void;
}

const PipelineBlockConfig = ({ block, onUpdateBlock }: PipelineBlockConfigProps) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (block) {
      setFormValues(block.config || {});
    } else {
      setFormValues({});
    }
  }, [block]);
  
  if (!block) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a block to configure</p>
      </div>
    );
  }
  
  const fields = configFields[block.type] || defaultFields;
  
  const handleChange = (field: string, value: string) => {
    setFormValues({
      ...formValues,
      [field]: value,
    });
  };
  
  const handleSave = () => {
    // Check if all required fields are filled
    const missingFields = fields.filter(
      field => !formValues[field.name]
    );
    
    if (missingFields.length > 0) {
      toast.warning(`Please fill out all fields for ${block.type}`);
      return;
    }
    
    const updatedBlock = {
      ...block,
      config: formValues,
      isConfigured: true,
    };
    
    onUpdateBlock(updatedBlock);
    toast.success(`${block.type} configuration saved`);
  };
  
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
      'unit-test': 'Unit Tests',
      'integration-test': 'Integration Tests',
      'security-scan': 'Security Scan',
      'notification': 'Notification',
      'webhook': 'Webhook',
      'artifact': 'Artifact',
    };
    
    return names[blockType] || blockType;
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Configure {getBlockName(block.type)}</h3>
        <p className="text-sm text-muted-foreground">
          Set parameters for this block
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
            </Label>
            <Input
              id={field.name}
              value={formValues[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
      
      <div className="border-t p-4 flex justify-end">
        <Button onClick={handleSave}>Save Configuration</Button>
      </div>
    </div>
  );
};

export default PipelineBlockConfig;
