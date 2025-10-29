import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DispatcherVoiceAssistant } from '@/utils/DispatcherVoiceAssistant';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UnifiedAssistantProps {
  userRole: 'dispatcher' | 'compliance_officer' | 'document_manager' | 'warehouse_manager';
  onClose?: () => void;
}

export function UnifiedAssistant({ userRole, onClose }: UnifiedAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const voiceAssistantRef = useRef<DispatcherVoiceAssistant | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMessage = (event: any) => {
    console.log('Voice event:', event.type);
    
    if (event.type === 'response.audio_transcript.delta') {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + event.delta }
          ];
        }
        return [...prev, { role: 'assistant', content: event.delta, timestamp: new Date() }];
      });
    } else if (event.type === 'response.audio_transcript.done') {
      setIsSpeaking(false);
    } else if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'input_audio_buffer.speech_started') {
      console.log('User started speaking');
    } else if (event.type === 'input_audio_buffer.speech_stopped') {
      console.log('User stopped speaking');
    }
  };

  const handleError = (error: Error) => {
    console.error('Voice assistant error:', error);
    toast({
      title: "Voice Error",
      description: error.message,
      variant: "destructive",
    });
    setIsVoiceActive(false);
  };

  const startVoiceSession = async () => {
    try {
      setIsLoading(true);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      voiceAssistantRef.current = new DispatcherVoiceAssistant(handleMessage, handleError);
      await voiceAssistantRef.current.init();
      
      setIsVoiceActive(true);
      toast({
        title: "Voice Active",
        description: "You can now speak to the assistant",
      });
    } catch (error) {
      console.error('Error starting voice:', error);
      toast({
        title: "Voice Error",
        description: error instanceof Error ? error.message : "Failed to start voice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopVoiceSession = () => {
    voiceAssistantRef.current?.disconnect();
    voiceAssistantRef.current = null;
    setIsVoiceActive(false);
    setIsSpeaking(false);
  };

  const sendTextMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Try voice assistant first if active
      if (isVoiceActive && voiceAssistantRef.current) {
        await voiceAssistantRef.current.sendTextMessage(input);
      } else {
        // Fallback to text API
        const { data, error } = await supabase.functions.invoke('unified-assistant', {
          body: { message: input, userRole }
        });

        if (error) throw error;

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">
          {userRole === 'dispatcher' ? 'Dispatcher' : 
           userRole === 'compliance_officer' ? 'Compliance' :
           userRole === 'document_manager' ? 'Document' :
           'Warehouse'} Assistant
        </CardTitle>
        <div className="flex items-center gap-2">
          {isVoiceActive && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Voice Active
            </span>
          )}
          {isSpeaking && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Speaking
            </span>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-muted-foreground">
                <p className="font-medium mb-2">How can I help you today?</p>
                <div className="text-sm space-y-1">
                  <p>Try commands like:</p>
                  <p className="text-xs italic">"Show dispatch history for Order 1123"</p>
                  <p className="text-xs italic">"Validate BG for SIT Arabian Contracting"</p>
                  <p className="text-xs italic">"Which vehicle needs service next week?"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice..."
            disabled={isLoading}
          />
          <Button
            onClick={sendTextMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
            disabled={isLoading}
            size="icon"
            variant={isVoiceActive ? "destructive" : "secondary"}
          >
            {isVoiceActive ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
