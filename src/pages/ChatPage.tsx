import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
        <p className="text-muted-foreground">Create a new warehouse order using our guided assistant</p>
      </div>
      <ChatInterface />
    </div>
  );
}
