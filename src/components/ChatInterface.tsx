import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateOrderId } from '@/data/mockData';
import type { ChatMessage, ChatState, ChatSessionData, ChatOption } from '@/types';

const initialSession: ChatSessionData = {
  state: 'welcome',
  boxesReceived: false,
  receivedDate: '',
  clientName: '',
  skus: [],
  currentSku: {},
};

function createBotMessage(text: string, options?: ChatOption[], inputType?: ChatMessage['inputType']): ChatMessage {
  return { id: crypto.randomUUID(), sender: 'bot', text, timestamp: new Date(), options, inputType };
}

function createUserMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), sender: 'user', text, timestamp: new Date() };
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSessionData>({ ...initialSession });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const addBotMessage = useCallback((text: string, options?: ChatOption[], inputType?: ChatMessage['inputType']) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, createBotMessage(text, options, inputType)]);
    }, 600);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setTimeout(() => {
        setMessages([createBotMessage(
          "👋 Welcome to WarehouseOS! I'll help you create an order.\n\nHave the boxes been received?",
          [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]
        )]);
        setSession(prev => ({ ...prev, state: 'ask_boxes_received' }));
      }, 300);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const processInput = useCallback((value: string) => {
    setMessages(prev => [...prev, createUserMessage(value)]);
    const v = value.trim().toLowerCase();

    setSession(prev => {
      const next = { ...prev };

      switch (prev.state) {
        case 'ask_boxes_received':
          if (v === 'yes') {
            next.boxesReceived = true;
            next.state = 'ask_received_date';
            addBotMessage('📅 When were the boxes received? (Enter date, e.g., 2026-04-10)', undefined, 'date');
          } else {
            next.boxesReceived = false;
            next.state = 'pending_order';
            const orderId = generateOrderId();
            addBotMessage(`📦 Order **${orderId}** created as **Pending**.\n\nWe'll notify you once the boxes arrive. You can check the status in your Orders page.`);
          }
          break;

        case 'ask_received_date':
          next.receivedDate = value.trim();
          next.state = 'ask_client_name';
          addBotMessage('👤 What is the client name?', undefined, 'text');
          break;

        case 'ask_client_name':
          next.clientName = value.trim();
          next.state = 'ask_sku_name';
          addBotMessage('📦 Enter the product name (SKU):', undefined, 'text');
          break;

        case 'ask_sku_name':
          next.currentSku = { product_name: value.trim() };
          next.state = 'ask_quantity';
          addBotMessage('🔢 Enter the quantity:', undefined, 'text');
          break;

        case 'ask_quantity':
          next.currentSku.quantity = parseInt(value) || 1;
          next.state = 'ask_fnsku';
          addBotMessage('🏷️ Does this SKU need FNSKU labeling?', [
            { label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }
          ]);
          break;

        case 'ask_fnsku':
          next.currentSku.fnsku_labeling = v === 'yes';
          next.state = 'ask_box_handling';
          addBotMessage('📦 Does this SKU need box handling?', [
            { label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }
          ]);
          break;

        case 'ask_box_handling':
          next.currentSku.box_handling = v === 'yes';
          next.state = 'ask_polybagging';
          addBotMessage('🛍️ Does this SKU need polybagging?', [
            { label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }
          ]);
          break;

        case 'ask_polybagging':
          next.currentSku.polybagging = v === 'yes';
          next.skus = [...prev.skus, { ...next.currentSku }];
          next.currentSku = {};
          next.state = 'ask_another_sku';
          addBotMessage('➕ Would you like to add another SKU?', [
            { label: 'Yes, add more', value: 'yes' }, { label: 'No, create order', value: 'no' }
          ]);
          break;

        case 'ask_another_sku':
          if (v === 'yes') {
            next.state = 'ask_sku_name';
            addBotMessage('📦 Enter the product name (SKU):', undefined, 'text');
          } else {
            next.state = 'confirm_order';
            const skuList = next.skus.map((s, i) =>
              `  ${i + 1}. **${s.product_name}** (×${s.quantity}) — FNSKU: ${s.fnsku_labeling ? '✅' : '❌'}, Box: ${s.box_handling ? '✅' : '❌'}, Poly: ${s.polybagging ? '✅' : '❌'}`
            ).join('\n');
            addBotMessage(
              `📋 **Order Summary**\n\n` +
              `Client: **${next.clientName}**\n` +
              `Received: **${next.receivedDate}**\n` +
              `SKUs:\n${skuList}\n\n` +
              `Confirm this order?`,
              [{ label: '✅ Confirm', value: 'yes' }, { label: '❌ Cancel', value: 'no' }]
            );
          }
          break;

        case 'confirm_order':
          if (v === 'yes') {
            const orderId = generateOrderId();
            next.state = 'order_created';
            addBotMessage(
              `🎉 **Order ${orderId} created successfully!**\n\n` +
              `Your order has been submitted and is now being processed. ` +
              `You can track its status on the Orders page.\n\n` +
              `An invoice has been automatically generated.`
            );
          } else {
            next.state = 'order_created';
            addBotMessage('❌ Order cancelled. You can start a new order anytime.');
          }
          break;

        default:
          break;
      }
      return next;
    });
  }, [addBotMessage]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    processInput(inputValue);
    setInputValue('');
  };

  const handleOptionClick = (value: string) => {
    processInput(value);
  };

  const handleNewOrder = () => {
    setMessages([]);
    setSession({ ...initialSession });
    initialized.current = false;
    setTimeout(() => {
      initialized.current = true;
      setMessages([createBotMessage(
        "👋 Welcome to WarehouseOS! I'll help you create an order.\n\nHave the boxes been received?",
        [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]
      )]);
      setSession(prev => ({ ...prev, state: 'ask_boxes_received' }));
    }, 300);
  };

  const isComplete = session.state === 'order_created' || session.state === 'pending_order';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b bg-card p-4 rounded-t-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
          W
        </div>
        <div>
          <p className="font-semibold text-sm">WarehouseOS Bot</p>
          <p className="text-xs text-success">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-accent/30 p-4 space-y-3 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex animate-slide-up',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                msg.sender === 'user'
                  ? 'bg-chat-user text-chat-user-foreground rounded-br-md'
                  : 'bg-card text-card-foreground rounded-bl-md'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.options && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleOptionClick(opt.value)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[10px] opacity-50">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-typing" style={{ animationDelay: '0s' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-typing" style={{ animationDelay: '0.2s' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-typing" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-3 rounded-b-lg">
        {isComplete ? (
          <Button onClick={handleNewOrder} className="w-full">
            Start New Order
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
