import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Keyboard } from 'lucide-react';

export function AssistantWelcome() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Assistant Available
        </CardTitle>
        <CardDescription>
          Get instant help with your tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Press{' '}
            <kbd className="px-2 py-1 text-xs bg-muted rounded border">Ctrl</kbd>
            {' + '}
            <kbd className="px-2 py-1 text-xs bg-muted rounded border">K</kbd>
            {' '}to open the assistant
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Or click the floating button in the bottom-right corner
        </div>
      </CardContent>
    </Card>
  );
}
