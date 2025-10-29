import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { UnifiedAssistant } from './UnifiedAssistant';

interface FloatingAssistantProps {
  userRole: 'dispatcher' | 'compliance_officer' | 'document_manager' | 'warehouse_manager';
}

export function FloatingAssistant({ userRole }: FloatingAssistantProps) {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      {!showAssistant && (
        <Button
          onClick={() => setShowAssistant(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 animate-in fade-in slide-in-from-bottom-5 duration-500"
          size="icon"
          title="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Assistant Panel */}
      {showAssistant && (
        <div className="fixed bottom-6 right-6 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <UnifiedAssistant 
            userRole={userRole} 
            onClose={() => setShowAssistant(false)} 
          />
        </div>
      )}
    </>
  );
}
