import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Users,
  Factory,
  Truck,
  HelpCircle,
  Video,
  FileText,
  Download,
  Search,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail
} from "lucide-react";

const TrainingSupport = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const trainingModules = {
    technician: [
      {
        title: "Farmer Registration & Management",
        duration: "30 mins",
        topics: ["Creating farmer profiles", "Document upload", "Certification tracking"],
        status: "essential"
      },
      {
        title: "Procurement Operations",
        duration: "45 mins",
        topics: ["Batch creation", "QR code generation", "Quality grading", "Price calculation"],
        status: "essential"
      },
      {
        title: "Mobile App Usage",
        duration: "20 mins",
        topics: ["QR scanning", "Offline mode", "GPS tracking", "Photo uploads"],
        status: "recommended"
      },
      {
        title: "AI Grading System",
        duration: "25 mins",
        topics: ["Image capture best practices", "Interpreting AI results", "Manual override"],
        status: "recommended"
      }
    ],
    logistics: [
      {
        title: "Shipment Management",
        duration: "40 mins",
        topics: ["Creating shipments", "Route planning", "GPS tracking", "Status updates"],
        status: "essential"
      },
      {
        title: "Route Optimization",
        duration: "30 mins",
        topics: ["AI-powered routing", "Delivery scheduling", "Vehicle assignment"],
        status: "recommended"
      },
      {
        title: "Temperature Monitoring",
        duration: "15 mins",
        topics: ["Setting thresholds", "Alert handling", "Compliance requirements"],
        status: "essential"
      }
    ],
    factory: [
      {
        title: "Warehouse Management",
        duration: "35 mins",
        topics: ["Inventory check-in/out", "Capacity monitoring", "Storage conditions"],
        status: "essential"
      },
      {
        title: "Processing Operations",
        duration: "50 mins",
        topics: ["Batch processing", "Quality control", "Progress tracking", "Output recording"],
        status: "essential"
      },
      {
        title: "Compliance & Reporting",
        duration: "40 mins",
        topics: ["Audit preparation", "Report generation", "Certification management"],
        status: "recommended"
      }
    ]
  };

  const quickGuides = [
    {
      title: "Creating a Procurement Batch",
      icon: FileText,
      steps: [
        "Navigate to Procurement page",
        "Click 'Add New Batch' button",
        "Select farmer from dropdown",
        "Enter quantity in kilograms",
        "Select tobacco grade",
        "Enter price per kg",
        "Upload quality test images (optional)",
        "Click 'Create Batch' to generate QR code"
      ]
    },
    {
      title: "Tracking a Shipment",
      icon: Truck,
      steps: [
        "Go to Logistics page",
        "Find shipment by ID or batch number",
        "View real-time GPS location on map",
        "Check temperature readings",
        "Update status as needed",
        "Record actual arrival time when delivered"
      ]
    },
    {
      title: "Managing Warehouse Inventory",
      icon: Factory,
      steps: [
        "Access Warehouse page",
        "Select target warehouse",
        "Click 'Check In' or 'Check Out'",
        "Scan or enter batch QR code",
        "Enter quantity",
        "Confirm transaction",
        "Review updated capacity percentage"
      ]
    },
    {
      title: "Using AI Grading",
      icon: BookOpen,
      steps: [
        "Navigate to AI Grading page",
        "Upload clear, well-lit tobacco leaf image",
        "Wait for AI analysis (15-30 seconds)",
        "Review grade, quality score, and defects",
        "Accept or modify the AI recommendation",
        "Submit feedback to improve accuracy"
      ]
    }
  ];

  const escalationMatrix = {
    technical: [
      {
        severity: "Critical",
        description: "System down, data loss, security breach",
        response: "Immediate",
        contact: "System Admin",
        phone: "+91-1800-TECH-911",
        escalation: "CTO (if unresolved in 30 mins)"
      },
      {
        severity: "High",
        description: "Feature not working, AI grading errors, login issues",
        response: "< 2 hours",
        contact: "Technical Support",
        phone: "+91-1800-SUPPORT",
        escalation: "IT Manager (if unresolved in 4 hours)"
      },
      {
        severity: "Medium",
        description: "Slow performance, UI glitches, minor bugs",
        response: "< 24 hours",
        contact: "Help Desk",
        phone: "+91-1800-HELP",
        escalation: "Team Lead (if unresolved in 2 days)"
      },
      {
        severity: "Low",
        description: "Feature requests, cosmetic issues, questions",
        response: "< 3 days",
        contact: "Support Email",
        phone: "support@tobaccotrace.com",
        escalation: "Product Manager (monthly review)"
      }
    ],
    operational: [
      {
        severity: "Critical",
        description: "Quality failure, safety incident, regulatory violation",
        response: "Immediate",
        contact: "Operations Director",
        phone: "+91-1800-OPS-911",
        escalation: "CEO (immediate notification)"
      },
      {
        severity: "High",
        description: "Shipment delay, quality concerns, supplier issues",
        response: "< 4 hours",
        contact: "Operations Manager",
        phone: "+91-1800-OPS-HIGH",
        escalation: "VP Operations (if unresolved in 8 hours)"
      },
      {
        severity: "Medium",
        description: "Process questions, inventory discrepancies",
        response: "< 1 day",
        contact: "Shift Supervisor",
        phone: "+91-1800-OPS-MED",
        escalation: "Operations Manager (if unresolved in 3 days)"
      },
      {
        severity: "Low",
        description: "Process improvements, training requests",
        response: "< 1 week",
        contact: "Team Lead",
        phone: "+91-1800-OPS-LOW",
        escalation: "Monthly team meeting"
      }
    ]
  };

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page. Enter your registered email address. You'll receive a password reset link via email within 5 minutes. Click the link and set a new password."
    },
    {
      question: "Why is the AI grading taking longer than usual?",
      answer: "AI grading typically takes 15-30 seconds. Delays may occur due to high server load, poor internet connection, or large image files (>5MB). Ensure your image is under 5MB and try again. If the issue persists, contact technical support."
    },
    {
      question: "Can I work offline with the mobile app?",
      answer: "Yes! The mobile app supports offline mode for basic tasks like QR scanning and photo capture. Data syncs automatically when you're back online. Note: AI grading and real-time tracking require internet connection."
    },
    {
      question: "How do I report a quality issue with a batch?",
      answer: "Go to the Procurement page, find the batch, click 'Report Issue', select issue type, add photos and description, then submit. Quality team will be notified immediately for critical issues."
    },
    {
      question: "What should I do if GPS tracking shows wrong location?",
      answer: "First, check if location services are enabled on the device. Ensure GPS has clear sky view. If issue persists, manually update location in the Logistics page and contact technical support to troubleshoot the GPS device."
    },
    {
      question: "How do I generate a compliance report?",
      answer: "Navigate to Compliance → Automated Reports. Select report type (GST/FCTC/ESG), choose date range, and click 'Generate'. Reports typically ready in 2-5 minutes. You can download as PDF or JSON format."
    },
    {
      question: "Who can modify procurement batch details?",
      answer: "Only Procurement Agents and Technicians can create and modify batches. Auditors and Admins have view and audit access. Role permissions are strictly enforced for data integrity."
    },
    {
      question: "How often should I calibrate weighbridge devices?",
      answer: "Weighbridges should be calibrated monthly or after every 1000 measurements, whichever comes first. Contact your regional equipment supervisor to schedule calibration. System will alert you when calibration is due."
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "destructive";
      case "High":
        return "default";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "essential" ? "default" : "secondary";
  };

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training & Support Center</h1>
        <p className="text-muted-foreground">
          Comprehensive guides, training materials, and support resources
        </p>
      </div>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="training">Training Modules</TabsTrigger>
          <TabsTrigger value="guides">Quick Guides</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Matrix</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Training Modules */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Role-Based Training Programs
              </CardTitle>
              <CardDescription>
                Structured learning paths for different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="technician">
                <TabsList>
                  <TabsTrigger value="technician">
                    <Users className="h-4 w-4 mr-2" />
                    Field Technicians
                  </TabsTrigger>
                  <TabsTrigger value="logistics">
                    <Truck className="h-4 w-4 mr-2" />
                    Logistics Team
                  </TabsTrigger>
                  <TabsTrigger value="factory">
                    <Factory className="h-4 w-4 mr-2" />
                    Factory Staff
                  </TabsTrigger>
                </TabsList>

                {Object.entries(trainingModules).map(([role, modules]) => (
                  <TabsContent key={role} value={role} className="space-y-3">
                    {modules.map((module, idx) => (
                      <Card key={idx}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(module.status) as any}>
                                {module.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {module.duration}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Topics Covered:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {module.topics.map((topic, i) => (
                                <li key={i}>{topic}</li>
                              ))}
                            </ul>
                            <div className="flex gap-2 pt-3">
                              <Button size="sm">
                                <Video className="h-4 w-4 mr-2" />
                                Watch Video
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Guides */}
        <TabsContent value="guides" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickGuides.map((guide, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <guide.icon className="h-5 w-5" />
                    {guide.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <Button size="sm" variant="outline" className="mt-4 w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Print Guide
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Escalation Matrix */}
        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issue Escalation Matrix
              </CardTitle>
              <CardDescription>
                Know who to contact and when to escalate issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="technical">
                <TabsList>
                  <TabsTrigger value="technical">Technical Issues</TabsTrigger>
                  <TabsTrigger value="operational">Operational Issues</TabsTrigger>
                </TabsList>

                {Object.entries(escalationMatrix).map(([type, issues]) => (
                  <TabsContent key={type} value={type} className="space-y-4">
                    {issues.map((issue, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{issue.severity} Priority</CardTitle>
                            <Badge variant={getSeverityColor(issue.severity) as any}>
                              Response: {issue.response}
                            </Badge>
                          </div>
                          <CardDescription>{issue.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Phone className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">Primary Contact</p>
                                <p className="text-sm">{issue.contact}</p>
                                <p className="text-xs text-muted-foreground">{issue.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Mail className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">Escalation Path</p>
                                <p className="text-sm">{issue.escalation}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Emergency Hotline (24/7)</p>
                  <p className="text-sm text-muted-foreground">Critical safety incidents</p>
                </div>
                <Badge variant="destructive">+91-1800-EMERGENCY</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">IT Support Desk</p>
                  <p className="text-sm text-muted-foreground">Technical assistance</p>
                </div>
                <Badge>+91-1800-IT-HELP</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Operations Center</p>
                  <p className="text-sm text-muted-foreground">Operational queries</p>
                </div>
                <Badge>+91-1800-OPS-CENTER</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No FAQs match your search. Try different keywords or contact support.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support Team
              </Button>
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Request Call Back
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingSupport;
