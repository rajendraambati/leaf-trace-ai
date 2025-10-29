import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Send, X, Loader2, Trash2, Download, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DispatcherVoiceAssistant } from '@/utils/DispatcherVoiceAssistant';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedQuery {
  label: string;
  query: string;
  icon: string;
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
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const voiceAssistantRef = useRef<DispatcherVoiceAssistant | null>(null);

  const getSuggestedQueries = (): SuggestedQuery[] => {
    switch (userRole) {
      case 'dispatcher':
        return [
          { label: 'Vehicle Status', query: 'Which vehicles need maintenance this week?', icon: '🚛' },
          { label: 'Order Tracking', query: 'Show dispatch history for recent orders', icon: '📦' },
          { label: 'Driver Info', query: 'Who is driving truck VH-001?', icon: '👤' },
        ];
      case 'compliance_officer':
        return [
          { label: 'Validate BG', query: 'Validate bank guarantee for pending entities', icon: '🏦' },
          { label: 'Check Reports', query: 'Show recent regulatory reports', icon: '📋' },
          { label: 'Entity Status', query: 'What is the compliance status for all entities?', icon: '✓' },
        ];
      case 'document_manager':
        return [
          { label: 'Recent Docs', query: 'Show recently generated documents', icon: '📄' },
          { label: 'Templates', query: 'What document templates are available?', icon: '📝' },
          { label: 'Pending', query: 'Which documents need approval?', icon: '⏳' },
        ];
      case 'warehouse_manager':
        return [
          { label: 'Inventory', query: 'Show current stock levels across warehouses', icon: '📊' },
          { label: 'Low Stock', query: 'Which warehouses have low stock?', icon: '⚠️' },
          { label: 'Shipments', query: 'Track incoming and outgoing shipments', icon: '🚚' },
        ];
      default:
        return [];
    }
  };

  const suggestedQueries = getSuggestedQueries();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to toggle assistant (when onClose is provided)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && onClose) {
        e.preventDefault();
        onClose();
      }
      // Escape to close
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const playTextToSpeech = async (text: string) => {
    if (!voiceResponseEnabled) return;

    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' }
      });

      if (error) throw error;

      // Convert base64 to audio blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audioRef.current.play();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
    }
  };

  const sendTextMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      // Try voice assistant first if active
      if (isVoiceActive && voiceAssistantRef.current) {
        await voiceAssistantRef.current.sendTextMessage(messageText);
      } else {
        // Fallback to text API
        const { data, error } = await supabase.functions.invoke('unified-assistant', {
          body: { message: messageText, userRole }
        });

        if (error) throw error;

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Play voice response if enabled
        if (voiceResponseEnabled) {
          await playTextToSpeech(data.reply);
        }
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

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    setTimeout(() => {
      sendTextMessage();
    }, 100);
  };

  const clearConversation = () => {
    setMessages([]);
    toast({
      title: "Conversation cleared",
      description: "All messages have been removed",
    });
  };

  const exportConversation = () => {
    const conversationText = messages.map(msg => 
      `[${msg.role.toUpperCase()}] ${msg.timestamp.toLocaleString()}\n${msg.content}\n`
    ).join('\n---\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Conversation exported",
      description: "Your conversation has been downloaded",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div>
          <CardTitle className="text-xl font-semibold">
            {userRole === 'dispatcher' ? 'Dispatcher' : 
             userRole === 'compliance_officer' ? 'Compliance' :
             userRole === 'document_manager' ? 'Document' :
             'Warehouse'} Assistant
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Esc</kbd> to close
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="voice-response"
              checked={voiceResponseEnabled}
              onCheckedChange={setVoiceResponseEnabled}
            />
            <Label htmlFor="voice-response" className="text-xs cursor-pointer">
              {voiceResponseEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </Label>
          </div>
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
          {messages.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={exportConversation}
                title="Export conversation"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearConversation}
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
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
              <div className="text-muted-foreground space-y-4">
                <div>
                  <p className="font-medium mb-2">How can I help you today?</p>
                  <p className="text-sm">Try these quick actions:</p>
                </div>
                <div className="grid gap-2 w-full max-w-md">
                  {suggestedQueries.map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuery(sq.query)}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-2xl">{sq.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{sq.label}</p>
                        <p className="text-xs text-muted-foreground">{sq.query}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
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
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {isVoiceActive ? 'Listening...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-2">
          {messages.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {suggestedQueries.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuery(sq.query)}
                  className="text-xs px-2 py-1 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                  disabled={isLoading}
                >
                  {sq.icon} {sq.label}
                </button>
              ))}
            </div>
          )}
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
        </div>
      </CardContent>
    </Card>
  );
}
