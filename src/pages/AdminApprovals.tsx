import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  requested_role: string;
  status: string;
  created_at: string;
  email_verified: boolean;
  phone_verified: boolean;
}

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  document_name: string;
}

export default function AdminApprovals() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userRole === 'system_admin' || userRole === 'admin') {
      fetchRegistrations();
    }
  }, [userRole]);

  useEffect(() => {
    if (selectedReg) {
      fetchDocuments(selectedReg.id);
    }
  }, [selectedReg]);

  const fetchRegistrations = async () => {
    const { data, error } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
      return;
    }

    setRegistrations(data || []);
  };

  const fetchDocuments = async (registrationId: string) => {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('registration_id', registrationId);

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const handleApprove = async () => {
    if (!selectedReg || !user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('registration-approval', {
        body: {
          registrationId: selectedReg.id,
          action: 'approve',
          notes
        }
      });

      if (error) throw error;

      toast({
        title: 'Registration Approved',
        description: `Account created successfully for ${selectedReg.email}`,
      });

      setSelectedReg(null);
      setNotes('');
      fetchRegistrations();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedReg || !user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('registration-approval', {
        body: {
          registrationId: selectedReg.id,
          action: 'decline',
          notes
        }
      });

      if (error) throw error;

      toast({
        title: 'Registration Declined',
        description: `Registration declined for ${selectedReg.email}`,
      });

      setSelectedReg(null);
      setNotes('');
      fetchRegistrations();
    } catch (error: any) {
      console.error('Decline error:', error);
      toast({
        title: 'Decline Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'system_admin' && userRole !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Registration Approvals</h1>
        <p className="text-muted-foreground">Review and approve pending user registrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Registrations ({registrations.length})</h2>
          {registrations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No pending registrations</p>
              </CardContent>
            </Card>
          ) : (
            registrations.map((reg) => (
              <Card
                key={reg.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedReg?.id === reg.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedReg(reg)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{reg.full_name}</CardTitle>
                      <CardDescription>{reg.email}</CardDescription>
                    </div>
                    <Badge>{reg.requested_role.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Phone: {reg.phone}</p>
                    <p>Submitted: {new Date(reg.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Registration Details */}
        <div>
          {selectedReg ? (
            <Card>
              <CardHeader>
                <CardTitle>Review Registration</CardTitle>
                <CardDescription>{selectedReg.full_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Documents */}
                <div>
                  <h3 className="font-semibold mb-3">Submitted Documents</h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {doc.document_type.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">{doc.document_name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.document_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <Textarea
                    placeholder="Add notes about this registration..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={handleApprove}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDecline}
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Select a registration to review
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}