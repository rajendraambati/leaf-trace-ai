import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DispatcherVoiceAssistant } from '@/utils/DispatcherVoiceAssistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DispatcherAssistantProps {
  onClose?: () => void;
}

export function DispatcherAssistant({ onClose }: DispatcherAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hi! I'm your dispatcher assistant. Try asking me:\n• 'Where is Truck 9?'\n• 'ETA for Order 1123'\n• 'Which driver needs rest?'\n\nYou can type or use voice!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const assistantRef = useRef<DispatcherVoiceAssistant | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentTranscriptRef = useRef<string>('');
  const currentResponseRef = useRef<string>('');

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMessage = (event: any) => {
    console.log('Event received:', event.type);

    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // User's speech transcribed
        if (event.transcript) {
          currentTranscriptRef.current = event.transcript;
          setMessages(prev => [...prev, {
            id: `user-${Date.now()}`,
            role: 'user',
            content: event.transcript,
            timestamp: new Date()
          }]);
        }
        break;

      case 'response.audio_transcript.delta':
        // Assistant's speech being transcribed (streaming)
        if (event.delta) {
          currentResponseRef.current += event.delta;
          
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant' && lastMessage.id.startsWith('temp-')) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: currentResponseRef.current }
              ];
            }
            return [...prev, {
              id: `temp-${Date.now()}`,
              role: 'assistant',
              content: currentResponseRef.current,
              timestamp: new Date()
            }];
          });
        }
        break;

      case 'response.audio_transcript.done':
        // Assistant's speech fully transcribed
        currentResponseRef.current = '';
        setIsAssistantSpeaking(false);
        break;

      case 'response.created':
        setIsAssistantSpeaking(true);
        setIsLoading(false);
        break;

      case 'response.done':
        setIsAssistantSpeaking(false);
        setIsLoading(false);
        break;

      case 'error':
        console.error('Realtime API error:', event);
        toast.error('Assistant error: ' + (event.error?.message || 'Unknown error'));
        setIsLoading(false);
        break;
    }
  };

  const handleError = (error: Error) => {
    console.error('Voice assistant error:', error);
    toast.error('Voice assistant error: ' + error.message);
    setIsConnected(false);
    setIsVoiceActive(false);
    setIsLoading(false);
  };

  const startVoiceSession = async () => {
    try {
      setIsLoading(true);
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      assistantRef.current = new DispatcherVoiceAssistant(handleMessage, handleError);
      await assistantRef.current.init();
      
      setIsConnected(true);
      setIsVoiceActive(true);
      
      toast.success("🎤 Voice assistant ready! Start speaking...");
    } catch (error) {
      console.error('Error starting voice session:', error);
      toast.error('Failed to start voice session: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsLoading(false);
    }
  };

  const stopVoiceSession = () => {
    assistantRef.current?.disconnect();
    assistantRef.current = null;
    setIsConnected(false);
    setIsVoiceActive(false);
    setIsAssistantSpeaking(false);
    toast.info("Voice session ended");
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      if (isConnected && assistantRef.current) {
        setIsLoading(true);
        currentResponseRef.current = '';
        await assistantRef.current.sendTextMessage(inputText);
      } else {
        // Fallback: show helpful message when not connected
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: "I'm not fully connected yet. Please start the voice session to enable real-time responses, or I can show you sample commands!",
            timestamp: new Date()
          }]);
        }, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
    <Card className="fixed bottom-6 right-6 w-[480px] max-w-[calc(100vw-3rem)] h-[600px] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Dispatcher Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {isAssistantSpeaking ? '🗣️ Speaking...' : isConnected ? '🎤 Listening' : '💬 Type or speak'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendTextMessage}
            disabled={!inputText.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
          disabled={isLoading}
          variant={isVoiceActive ? "destructive" : "outline"}
          className="w-full"
        >
          {isVoiceActive ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              Stop Voice
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Start Voice
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
