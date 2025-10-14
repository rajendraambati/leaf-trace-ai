import { useState } from "react";
import { Sparkles, Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AIGrading() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please upload an image first");
      return;
    }

    setAnalyzing(true);
    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('tobacco-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tobacco-images')
        .getPublicUrl(filePath);

      // Call AI grading edge function
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-grading', {
        body: { imageUrl: publicUrl }
      });

      if (aiError) throw aiError;

      // Store results in database
      const { error: dbError } = await supabase
        .from('ai_gradings')
        .insert({
          image_url: publicUrl,
          ai_grade: aiData.grade || aiData.ai_grade,
          quality_score: aiData.quality_score,
          crop_health_score: aiData.crop_health_score,
          esg_score: aiData.esg_score,
          confidence: aiData.confidence,
          defects_detected: aiData.defects_detected || [],
          recommendations: aiData.recommendations || []
        });

      if (dbError) throw dbError;

      setResults({
        grade: aiData.grade || aiData.ai_grade,
        quality: aiData.quality_score || 0,
        color: aiData.color_score || 85,
        texture: aiData.texture_score || 90,
        moisture: aiData.moisture_score || 75,
        esgScore: aiData.esg_score || 0,
        cropHealth: aiData.crop_health_score || 0,
        recommendations: aiData.recommendations || []
      });

      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || "Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Powered Grading</h1>
        <p className="text-muted-foreground mt-1">
          Advanced AI analysis for tobacco quality, crop health, and ESG scoring
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Upload Sample
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP (max. 10MB)
                    </p>
                  </>
                )}
              </div>
            </label>
            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card className="border-success/50 bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-background p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  AI Grade
                </p>
                <p className="text-3xl font-bold text-success">{results.grade}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Overall Quality</span>
                    <span className="text-muted-foreground">{results.quality}%</span>
                  </div>
                  <Progress value={results.quality} className="bg-muted [&>div]:bg-success" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Color Score</span>
                    <span className="text-muted-foreground">{results.color}%</span>
                  </div>
                  <Progress value={results.color} className="bg-muted [&>div]:bg-success" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Texture Score</span>
                    <span className="text-muted-foreground">{results.texture}%</span>
                  </div>
                  <Progress value={results.texture} className="bg-muted [&>div]:bg-success" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Moisture Content</span>
                    <span className="text-muted-foreground">{results.moisture}%</span>
                  </div>
                  <Progress value={results.moisture} className="bg-muted [&>div]:bg-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {results && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>ESG Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{results.esgScore}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Environmental, Social & Governance
                  </p>
                </div>
                <Progress value={results.esgScore} className="bg-muted [&>div]:bg-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crop Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-success">{results.cropHealth}</p>
                  <p className="text-sm text-muted-foreground mt-1">Health Index</p>
                </div>
                <Progress value={results.cropHealth} className="bg-muted [&>div]:bg-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
