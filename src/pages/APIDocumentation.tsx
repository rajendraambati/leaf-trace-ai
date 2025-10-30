import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Code, 
  Key, 
  Play, 
  Copy, 
  CheckCircle2,
  AlertCircle,
  Book,
  Zap,
  Shield,
  Server
} from 'lucide-react';

export default function APIDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('erp-sync');
  const [testApiKey, setTestApiKey] = useState('');
  const [testPayload, setTestPayload] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiEndpoints = [
    {
      id: 'erp-sync',
      name: 'ERP Sync API',
      path: '/functions/v1/api-erp-sync',
      description: 'Synchronize ERP orders, get status updates, and manage order lifecycle',
      methods: ['POST'],
      icon: Server,
    },
    {
      id: 'vehicle-tracking',
      name: 'Vehicle Tracking API',
      path: '/functions/v1/api-vehicle-tracking',
      description: 'Real-time vehicle location updates and route tracking',
      methods: ['POST'],
      icon: Zap,
    },
    {
      id: 'serialization',
      name: 'Serialization API',
      path: '/functions/v1/api-serialization',
      description: 'Verify serial numbers, track movements, and manage product units',
      methods: ['POST'],
      icon: Shield,
    },
    {
      id: 'compliance',
      name: 'Compliance API',
      path: '/functions/v1/api-compliance',
      description: 'Submit compliance reports and validate regulatory documents',
      methods: ['POST'],
      icon: CheckCircle2,
    },
  ];

  const exampleRequests = {
    'erp-sync': {
      push_order: {
        action: 'push_order',
        data: {
          po_number: 'PO-2024-001',
          product_type: 'Tobacco Leaf',
          quantity_kg: 1000,
          delivery_date: '2024-12-31',
          processing_unit_id: 'UNIT-001',
          source_system: 'SAP ERP'
        }
      },
      get_status: {
        action: 'get_status',
        data: {
          po_number: 'PO-2024-001'
        }
      }
    },
    'vehicle-tracking': {
      list_vehicles: {
        action: 'list_vehicles'
      },
      update_location: {
        action: 'update_location',
        shipment_id: 'SHP-123',
        latitude: 28.7041,
        longitude: 77.1025
      }
    },
    'serialization': {
      verify_serial: {
        action: 'verify_serial',
        serial_number: 'SN-2024-001'
      },
      register_serial: {
        action: 'register_serial',
        serial_number: 'SN-2024-NEW',
        batch_id: 'BTH-123',
        location: 'Warehouse A'
      }
    },
    'compliance': {
      submit_report: {
        action: 'submit_report',
        report_data: {
          report_type: 'monthly',
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          metrics: {
            total_production: 5000,
            compliant_units: 4950
          }
        }
      },
      validate_documents: {
        action: 'validate_documents',
        entity_id: 'ENT-001',
        entity_type: 'warehouse'
      }
    }
  };

  const handleTestAPI = async () => {
    if (!testApiKey) {
      toast.error('Please enter an API key');
      return;
    }

    if (!testPayload) {
      toast.error('Please enter request payload');
      return;
    }

    setIsLoading(true);
    setTestResponse('');

    try {
      const endpoint = apiEndpoints.find(e => e.id === selectedEndpoint);
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${baseUrl}${endpoint?.path}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': testApiKey,
        },
        body: testPayload,
      });

      const data = await response.json();
      setTestResponse(JSON.stringify(data, null, 2));

      if (response.ok) {
        toast.success('API request successful');
      } else {
        toast.error('API request failed');
      }
    } catch (error) {
      console.error('API test error:', error);
      setTestResponse(JSON.stringify({ error: 'Request failed', details: error }, null, 2));
      toast.error('Failed to test API');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const loadExample = (exampleKey: string) => {
    const examples = exampleRequests[selectedEndpoint as keyof typeof exampleRequests];
    const example = examples[exampleKey as keyof typeof examples];
    setTestPayload(JSON.stringify(example, null, 2));
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Code className="h-8 w-8" />
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            RESTful APIs for ERP integration, vehicle tracking, serialization, and compliance reporting
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">1</div>
                  Get API Key
                </div>
                <p className="text-sm text-muted-foreground">
                  Navigate to Settings to generate your API key
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">2</div>
                  Choose Endpoint
                </div>
                <p className="text-sm text-muted-foreground">
                  Select the API that matches your integration needs
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">3</div>
                  Test in Sandbox
                </div>
                <p className="text-sm text-muted-foreground">
                  Use the sandbox below to test your integration
                </p>
              </div>
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Authentication</AlertTitle>
              <AlertDescription>
                All API requests require an API key in the <code className="bg-muted px-1 rounded">X-API-Key</code> header.
                Sandbox keys are available for testing without affecting production data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
          <TabsList className="grid w-full grid-cols-4">
            {apiEndpoints.map((endpoint) => (
              <TabsTrigger key={endpoint.id} value={endpoint.id}>
                <endpoint.icon className="h-4 w-4 mr-2" />
                {endpoint.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {apiEndpoints.map((endpoint) => (
            <TabsContent key={endpoint.id} value={endpoint.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <endpoint.icon className="h-5 w-5" />
                        {endpoint.name}
                      </CardTitle>
                      <CardDescription className="mt-2">{endpoint.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">REST API</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Endpoint Details */}
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>{endpoint.methods[0]}</Badge>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL}${endpoint.path}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Example Requests */}
                  <div>
                    <h3 className="font-semibold mb-3">Example Requests</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(exampleRequests[endpoint.id as keyof typeof exampleRequests]).map((key) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => loadExample(key)}
                        >
                          {key.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* API Sandbox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              API Sandbox
            </CardTitle>
            <CardDescription>
              Test API endpoints in real-time with your API key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={testApiKey}
                    onChange={(e) => setTestApiKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payload">Request Payload (JSON)</Label>
                  <Textarea
                    id="payload"
                    placeholder="Enter request payload"
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className="font-mono text-sm h-64"
                  />
                </div>

                <Button onClick={handleTestAPI} disabled={isLoading} className="w-full">
                  {isLoading ? 'Testing...' : 'Send Request'}
                  <Play className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Response</Label>
                <ScrollArea className="h-[400px] bg-muted rounded-lg p-4">
                  {testResponse ? (
                    <pre className="text-sm font-mono whitespace-pre-wrap">{testResponse}</pre>
                  ) : (
                    <p className="text-muted-foreground text-center py-12">
                      Response will appear here after sending a request
                    </p>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits & Best Practices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm">Requests per hour</span>
                <Badge variant="secondary">1,000</Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm">Concurrent connections</span>
                <Badge variant="secondary">10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Payload size limit</span>
                <Badge variant="secondary">5 MB</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                  <span>Store API keys securely, never in client-side code</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                  <span>Implement exponential backoff for retry logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                  <span>Use sandbox keys for development and testing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                  <span>Monitor rate limits and implement caching</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
