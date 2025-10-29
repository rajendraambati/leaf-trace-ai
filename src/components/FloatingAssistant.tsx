import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { UnifiedAssistant } from './UnifiedAssistant';

interface FloatingAssistantProps {
  userRole: 'dispatcher' | 'compliance_officer' | 'document_manager' | 'warehouse_manager';
  pageContext?: string;
}

export function FloatingAssistant({ userRole, pageContext }: FloatingAssistantProps) {
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    // Global keyboard shortcut: Ctrl/Cmd + K to toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowAssistant(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating Toggle Button */}
      {!showAssistant && (
        <Button
          onClick={() => setShowAssistant(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 animate-in fade-in slide-in-from-bottom-5 duration-500 hover:scale-110 transition-transform"
          size="icon"
          title="Open AI Assistant (Ctrl/Cmd + K)"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Assistant Panel */}
      {showAssistant && (
        <div className="fixed bottom-6 right-6 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <UnifiedAssistant 
            userRole={userRole}
            pageContext={pageContext}
            onClose={() => setShowAssistant(false)} 
          />
        </div>
      )}
    </>
  );
}
