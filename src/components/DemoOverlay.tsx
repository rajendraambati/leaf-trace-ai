import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDemoMode } from '@/hooks/useDemoMode';

export default function DemoOverlay() {
  const {
    isActive,
    currentStep,
    totalSteps,
    isAsking,
    nextStep,
    previousStep,
    stopDemo,
    askQuestion,
    getCurrentStep,
  } = useDemoMode();

  const [showQA, setShowQA] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const step = getCurrentStep();

  if (!isActive || !step) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAskQuestion = async () => {
    const result = await askQuestion(question);
    if (result) {
      setAnswer(result);
      setQuestion('');
    }
  };

  const handleSpeak = (text: string) => {
    if (!voiceEnabled) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && stopDemo()}
      >
        {/* Demo Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4"
        >
          <Card className="shadow-2xl border-primary/20">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Demo Mode</Badge>
                    <Badge variant="outline">
                      Step {currentStep + 1} of {totalSteps}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (!voiceEnabled) {
                        handleSpeak(step.description);
                      } else {
                        speechSynthesis.cancel();
                      }
                    }}
                  >
                    {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={stopDemo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <Progress value={progress} className="mb-6" />

              {/* Impact Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Business Impact</p>
                    <p className="text-sm font-medium">{step.businessImpact}</p>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/5 border-secondary/20">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Compliance Value</p>
                    <p className="text-sm font-medium">{step.complianceValue}</p>
                  </CardContent>
                </Card>
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">ROI</p>
                    <p className="text-sm font-medium">{step.roi}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Highlights */}
              {step.highlights && step.highlights.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">Key Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {step.highlights.map((highlight, idx) => (
                      <Badge key={idx} variant="outline">{highlight}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowQA(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask AI
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={nextStep}>
                    {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Q&A Dialog */}
        <Dialog open={showQA} onOpenChange={setShowQA}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ask AI Assistant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask any question about this feature..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                />
                <Button onClick={handleAskQuestion} disabled={isAsking || !question.trim()}>
                  {isAsking ? 'Asking...' : 'Ask'}
                </Button>
              </div>

              {answer && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Answer:</p>
                    <p className="text-sm whitespace-pre-wrap">{answer}</p>
                  </CardContent>
                </Card>
              )}

              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Suggested questions:</p>
                <ul className="space-y-1">
                  <li>• How does this integrate with existing systems?</li>
                  <li>• What's the implementation timeline?</li>
                  <li>• How is data security handled?</li>
                  <li>• What training is provided?</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
