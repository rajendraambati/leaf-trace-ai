import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Upload, CheckCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [documents, setDocuments] = useState({
    identityProof: null as File | null,
    certification: null as File | null,
    license: null as File | null,
    biometric: null as File | null
  });

  useEffect(() => {
    if (!role) {
      navigate('/role-selection');
    }
  }, [role, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (type: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const uploadDocument = async (file: File, registrationId: string, docType: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${registrationId}/${docType}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('registration-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('registration-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive'
        });
        return;
      }

      if (!documents.identityProof || !documents.certification) {
        toast({
          title: 'Error',
          description: 'Please upload required documents (Identity Proof and Certification)',
          variant: 'destructive'
        });
        return;
      }

      // Create user account in Supabase Auth immediately
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Create pending registration linked to the user
      const { data: registration, error: regError } = await supabase
        .from('pending_registrations')
        .insert([{
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          requested_role: role as any,
          email_verified: false,
          phone_verified: false
        }])
        .select()
        .single();

      if (regError) throw regError;

      // Upload documents
      const docUploads = [];
      
      if (documents.identityProof) {
        const url = await uploadDocument(documents.identityProof, registration.id, 'identity_proof');
        docUploads.push({
          registration_id: registration.id,
          document_type: 'identity_proof',
          document_url: url,
          document_name: documents.identityProof.name
        });
      }

      if (documents.certification) {
        const url = await uploadDocument(documents.certification, registration.id, 'certification');
        docUploads.push({
          registration_id: registration.id,
          document_type: 'certification',
          document_url: url,
          document_name: documents.certification.name
        });
      }

      if (documents.license) {
        const url = await uploadDocument(documents.license, registration.id, 'license');
        docUploads.push({
          registration_id: registration.id,
          document_type: 'license',
          document_url: url,
          document_name: documents.license.name
        });
      }

      if (documents.biometric) {
        const url = await uploadDocument(documents.biometric, registration.id, 'biometric');
        docUploads.push({
          registration_id: registration.id,
          document_type: 'biometric',
          document_url: url,
          document_name: documents.biometric.name
        });
      }

      // Insert document records
      const { error: docError } = await supabase
        .from('user_documents')
        .insert(docUploads);

      if (docError) throw docError;

      setSubmitted(true);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted!</CardTitle>
            <CardDescription>
              Thanks for registering with us. We will get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/role-selection')}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/role-selection')}
            className="mb-4 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Role Selection
          </Button>
          <div className="flex justify-center mb-4">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Registration</CardTitle>
          <CardDescription className="text-center">
            Complete your registration for {role?.replace('_', ' ').toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required Documents</h3>
              
              <Alert>
                <AlertDescription>
                  Please upload clear copies of your documents. Supported formats: PDF, JPG, PNG
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="identityProof">Identity Proof * (Passport/National ID)</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="identityProof"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('identityProof', e.target.files?.[0] || null)}
                      required
                    />
                    {documents.identityProof && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                </div>

                <div>
                  <Label htmlFor="certification">Certification/License * </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="certification"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('certification', e.target.files?.[0] || null)}
                      required
                    />
                    {documents.certification && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                </div>

                <div>
                  <Label htmlFor="license">Additional License (Optional)</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="license"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('license', e.target.files?.[0] || null)}
                    />
                    {documents.license && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                </div>

                <div>
                  <Label htmlFor="biometric">Biometric Data (Optional)</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="biometric"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('biometric', e.target.files?.[0] || null)}
                    />
                    {documents.biometric && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}