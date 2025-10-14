import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Layers, Database, Cloud, Shield, Cpu, Smartphone,
  Network, GitBranch, Lock, Zap, ArrowRight
} from "lucide-react";

export default function Architecture() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">System Architecture</h1>
        <p className="text-muted-foreground mt-2">
          Modular architecture with React frontend, Supabase backend, Lovable AI, and IoT integration
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="tech-stack">Tech Stack</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Layers className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Frontend Layer</CardTitle>
                <CardDescription>React-based user interface</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• React 18 with TypeScript</li>
                  <li>• Vite for build tooling</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• Shadcn/ui components</li>
                  <li>• Real-time data updates</li>
                  <li>• Mobile-responsive design</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Backend Layer</CardTitle>
                <CardDescription>Supabase/Lovable Cloud</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• PostgreSQL database</li>
                  <li>• Edge Functions (Deno)</li>
                  <li>• Row-Level Security (RLS)</li>
                  <li>• Real-time subscriptions</li>
                  <li>• RESTful API</li>
                  <li>• File storage support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cpu className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI Layer</CardTitle>
                <CardDescription>Lovable AI Gateway</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Gemini 2.5 Flash (default)</li>
                  <li>• GPT-5 models</li>
                  <li>• Quality grading</li>
                  <li>• ESG scoring</li>
                  <li>• Image analysis</li>
                  <li>• Predictive analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Architecture Principles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Network className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Modular Design</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear separation between modules (Farmers, Procurement, Logistics, etc.)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Real-time Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      Live data synchronization using Supabase real-time channels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Security First</h4>
                    <p className="text-sm text-muted-foreground">
                      RLS policies, JWT authentication, and role-based access control
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Cloud Native</h4>
                    <p className="text-sm text-muted-foreground">
                      Serverless architecture with automatic scaling
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Presentation Layer (Frontend)</CardTitle>
              <CardDescription>User interface and interaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Components</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <Badge variant="outline">Dashboard</Badge>
                  <Badge variant="outline">Farmers</Badge>
                  <Badge variant="outline">Procurement</Badge>
                  <Badge variant="outline">Logistics</Badge>
                  <Badge variant="outline">Warehouse</Badge>
                  <Badge variant="outline">Processing</Badge>
                  <Badge variant="outline">Compliance</Badge>
                  <Badge variant="outline">AI Grading</Badge>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Responsive design for mobile, tablet, desktop</li>
                  <li>• Dark/light theme support</li>
                  <li>• Interactive charts and visualizations</li>
                  <li>• QR code generation and scanning</li>
                  <li>• Map-based farmer locations</li>
                  <li>• Real-time status updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Business Logic Layer (Edge Functions)</CardTitle>
              <CardDescription>Server-side processing and validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Edge Functions</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• AI Grading: Processes images and returns quality scores</li>
                  <li>• Data Validation: Ensures data integrity before storage</li>
                  <li>• Business Rules: Implements complex logic server-side</li>
                  <li>• External API Integration: Connects to third-party services</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Data Layer (PostgreSQL)</CardTitle>
              <CardDescription>Database schema and relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Core Tables</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• farmers</li>
                    <li>• procurement_batches</li>
                    <li>• shipments</li>
                    <li>• warehouses</li>
                    <li>• warehouse_inventory</li>
                    <li>• processing_batches</li>
                    <li>• compliance_audits</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Support Tables</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• profiles</li>
                    <li>• user_roles</li>
                    <li>• ai_gradings</li>
                    <li>• batch_quality_tests</li>
                    <li>• farmer_certifications</li>
                    <li>• esg_scores</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. AI/ML Layer</CardTitle>
              <CardDescription>Lovable AI integration for intelligent features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">AI Capabilities</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Image-based quality grading</li>
                  <li>• ESG compliance scoring</li>
                  <li>• Crop health assessment</li>
                  <li>• Defect detection</li>
                  <li>• Predictive analytics</li>
                  <li>• Automated recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. IoT Integration Layer</CardTitle>
              <CardDescription>Real-time sensor data collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Warehouse Sensors</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Temperature</li>
                    <li>• Humidity</li>
                    <li>• Air Quality</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Logistics Sensors</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• GPS Tracking</li>
                    <li>• Temperature</li>
                    <li>• Vehicle Status</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Farm Sensors</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Location (GPS)</li>
                    <li>• Field Conditions</li>
                    <li>• Weather Data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>End-to-End Data Flow: Farmer to Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Farmer Registration</h4>
                    <p className="text-sm text-muted-foreground">
                      Farmer profile created with location, certifications, and farm details
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Procurement & AI Grading</h4>
                    <p className="text-sm text-muted-foreground">
                      Batch created → QR code generated → AI analyzes quality → Grades stored
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Shipment Creation</h4>
                    <p className="text-sm text-muted-foreground">
                      Logistics creates shipment → GPS tracking enabled → Temperature monitoring active
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">4</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Warehouse Storage</h4>
                    <p className="text-sm text-muted-foreground">
                      Delivery confirmed → Inventory updated → IoT sensors monitor conditions
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">5</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      Stock released → Processing units transform tobacco → Quality tracked
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">6</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Compliance & Reporting</h4>
                    <p className="text-sm text-muted-foreground">
                      Audits conducted → ESG scores calculated → Reports generated → Feedback to farmer
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Module Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Data Producers</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Farmers:</strong> Profile, location, certifications</p>
                    <p><strong>Procurement:</strong> Batches, QR codes, prices</p>
                    <p><strong>AI Grading:</strong> Quality scores, ESG ratings</p>
                    <p><strong>Logistics:</strong> GPS data, delivery status</p>
                    <p><strong>IoT Sensors:</strong> Temperature, humidity</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Data Consumers</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Warehouse:</strong> Inventory levels, conditions</p>
                    <p><strong>Processing:</strong> Batch status, output data</p>
                    <p><strong>Compliance:</strong> All data for audits</p>
                    <p><strong>Analytics:</strong> Aggregated metrics</p>
                    <p><strong>Dashboards:</strong> Real-time visualizations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">1. User Login</h4>
                    <p className="text-sm text-muted-foreground">
                      User provides email/password → Supabase Auth validates credentials
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">2. Token Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      JWT access token generated → Refresh token for session management
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <GitBranch className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">3. Role Assignment</h4>
                    <p className="text-sm text-muted-foreground">
                      User roles fetched from user_roles table → Permissions determined
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">4. Request Authorization</h4>
                    <p className="text-sm text-muted-foreground">
                      Every API request includes JWT → RLS policies enforce access control
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Technician</h4>
                    <Badge>Default Role</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage farmers, create batches, run AI grading, view reports
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Procurement Agent</h4>
                  <p className="text-sm text-muted-foreground">
                    Create/update procurement batches, manage farmer relationships
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Logistics Manager</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage shipments, track GPS, monitor temperature, update delivery status
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Factory Manager</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage warehouses, processing units, inventory, monitor IoT sensors
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Auditor</h4>
                    <Badge variant="secondary">Full Access</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete access to all modules for compliance audits and reporting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Row-Level Security (RLS) Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Every database table has RLS policies that automatically filter data based on the authenticated user's role and identity.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-semibold text-sm mb-1">Read Policies</h5>
                    <p className="text-xs text-muted-foreground">Control who can view data</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-semibold text-sm mb-1">Write Policies</h5>
                    <p className="text-xs text-muted-foreground">Control who can create/update</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-semibold text-sm mb-1">Delete Policies</h5>
                    <p className="text-xs text-muted-foreground">Control who can remove data</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-semibold text-sm mb-1">Role-Based Policies</h5>
                    <p className="text-xs text-muted-foreground">Permissions based on user role</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tech-stack" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Frontend Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge className="mb-2">React 18</Badge>
                    <p className="text-sm text-muted-foreground">Modern component-based UI framework</p>
                  </div>
                  <div>
                    <Badge className="mb-2">TypeScript</Badge>
                    <p className="text-sm text-muted-foreground">Type-safe development</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Vite</Badge>
                    <p className="text-sm text-muted-foreground">Fast build tooling</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Tailwind CSS</Badge>
                    <p className="text-sm text-muted-foreground">Utility-first styling</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Shadcn/ui</Badge>
                    <p className="text-sm text-muted-foreground">Component library</p>
                  </div>
                  <div>
                    <Badge className="mb-2">React Router</Badge>
                    <p className="text-sm text-muted-foreground">Client-side routing</p>
                  </div>
                  <div>
                    <Badge className="mb-2">TanStack Query</Badge>
                    <p className="text-sm text-muted-foreground">Data fetching & caching</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Recharts</Badge>
                    <p className="text-sm text-muted-foreground">Charts and visualizations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Backend Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge className="mb-2">PostgreSQL</Badge>
                    <p className="text-sm text-muted-foreground">Relational database</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Supabase</Badge>
                    <p className="text-sm text-muted-foreground">Backend-as-a-Service platform</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Edge Functions (Deno)</Badge>
                    <p className="text-sm text-muted-foreground">Serverless TypeScript functions</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Row-Level Security</Badge>
                    <p className="text-sm text-muted-foreground">Database-level access control</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Real-time Subscriptions</Badge>
                    <p className="text-sm text-muted-foreground">Live data updates</p>
                  </div>
                  <div>
                    <Badge className="mb-2">PostgREST</Badge>
                    <p className="text-sm text-muted-foreground">Auto-generated RESTful API</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cpu className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge className="mb-2">Lovable AI Gateway</Badge>
                    <p className="text-sm text-muted-foreground">Unified AI API access</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Gemini 2.5 Flash</Badge>
                    <p className="text-sm text-muted-foreground">Default AI model for grading</p>
                  </div>
                  <div>
                    <Badge className="mb-2">GPT-5 Models</Badge>
                    <p className="text-sm text-muted-foreground">Advanced reasoning capabilities</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Image Analysis</Badge>
                    <p className="text-sm text-muted-foreground">Multimodal AI processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Security & Auth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge className="mb-2">JWT Tokens</Badge>
                    <p className="text-sm text-muted-foreground">Secure authentication</p>
                  </div>
                  <div>
                    <Badge className="mb-2">OAuth 2.0</Badge>
                    <p className="text-sm text-muted-foreground">Standard auth protocol</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Row-Level Security</Badge>
                    <p className="text-sm text-muted-foreground">Data access control</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Role-Based Access</Badge>
                    <p className="text-sm text-muted-foreground">Permission management</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Encrypted Storage</Badge>
                    <p className="text-sm text-muted-foreground">Secure data at rest</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
