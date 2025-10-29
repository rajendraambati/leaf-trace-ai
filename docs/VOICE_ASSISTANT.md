# Voice/Chat Assistant System

## Overview
The Voice/Chat Assistant is a unified AI-powered interface available across multiple pages in the application. It provides both voice and text interaction with role-specific context and actionable insights.

## Features

### 🎤 **Voice Interaction**
- **Voice Input**: Real-time voice recognition using OpenAI Whisper API
- **Voice Output**: Text-to-speech responses using OpenAI TTS (toggle on/off)
- **Voice Assistant**: Full duplex voice conversation via OpenAI Realtime API

### 💬 **Text Chat**
- Role-specific suggested queries
- Context-aware responses based on current page
- Conversation history with timestamps
- Export conversations as text files
- Clear conversation history

### 🎯 **Interactive Actions**
The assistant can suggest and execute actions directly:
- **View Order Details** - Fetch complete order information
- **Check Vehicle Status** - Get vehicle and maintenance details
- **Mark Shipment In Transit** - Update shipment status
- **Confirm Delivery** - Mark delivery as completed
- **Check Warehouse Stock** - View inventory levels
- **List Pending Documents** - Show draft documents

### ⌨️ **Keyboard Shortcuts**
- `Ctrl/Cmd + K` - Toggle assistant
- `Esc` - Close assistant
- `Enter` - Send message

### 🎨 **User Experience**
- Floating button (bottom-right corner)
- Smooth animations and transitions
- Loading states and typing indicators
- Visual feedback for voice activity
- Welcome card with keyboard hints

## Available Locations

### 1. **Dispatcher Dashboard** (`/dispatcher-dashboard`)
- **Role**: Dispatcher
- **Context**: Active trips, vehicles, driver wellbeing
- **Sample Queries**:
  - "Which vehicles need maintenance this week?"
  - "Show dispatch history for Order 1123"
  - "Who is driving truck VH-001?"
- **Actions**: View orders, check vehicles, update shipments

### 2. **Logistics Tracking** (`/logistics`)
- **Role**: Dispatcher
- **Context**: Shipments, batches, GPS tracking
- **Sample Queries**:
  - "Show me all in-transit shipments"
  - "What's the status of shipment SHP-12345?"
  - "Which shipments are delayed?"
- **Actions**: Mark in transit, confirm delivery

### 3. **Warehouse Management** (`/warehouse`)
- **Role**: Warehouse Manager
- **Context**: Warehouses, inventory, IoT sensors
- **Sample Queries**:
  - "Show current stock levels across warehouses"
  - "Which warehouses have low stock?"
  - "Track incoming and outgoing shipments"
- **Actions**: Check stock, view inventory

### 4. **Document Management** (`/document-management`)
- **Role**: Document Manager
- **Context**: Generated documents, templates
- **Sample Queries**:
  - "Show recently generated documents"
  - "What document templates are available?"
  - "Which documents need approval?"
- **Actions**: List pending documents, view templates

### 5. **Regulatory Reporting** (`/regulatory-reporting`)
- **Role**: Compliance Officer
- **Context**: Regulatory reports, compliance documents
- **Sample Queries**:
  - "Validate bank guarantee for pending entities"
  - "Show recent regulatory reports"
  - "What is the compliance status for all entities?"
- **Actions**: Validate documents, check compliance

## Technical Implementation

### Edge Functions

#### `unified-assistant`
- Main AI orchestration function
- Gathers context from relevant database tables
- Uses Lovable AI (Gemini 2.5 Flash) for responses
- Suggests actionable commands based on context
- Implements empathetic fallback messages

#### `text-to-speech`
- Converts text to speech using OpenAI TTS
- Voice: Alloy (default)
- Model: tts-1-hd
- Output: MP3 format, base64 encoded

#### `assistant-actions`
- Executes actions suggested by the assistant
- Server-side validation and security
- Direct database operations via Supabase
- Returns structured results

### Database Context

The assistant automatically gathers relevant context:
- **Orders**: `erp_procurement_orders` with dispatches
- **Compliance**: `compliance_documents` by entity name
- **Vehicles**: `vehicles` with maintenance schedules
- **Shipments**: `shipments` with status tracking
- **Reports**: `regulatory_reports` by date
- **Documents**: `generated_documents` by type/status
- **Warehouses**: `warehouses` with inventory

### Security

- **JWT Authentication**: All functions require valid auth tokens
- **RLS Policies**: Data filtered by user permissions
- **Role-Based Access**: Context limited to user role
- **Secure Actions**: Server-side validation for all operations

## Usage Examples

### Example 1: Dispatcher Query
**User**: "Show me all vehicles that need service"

**Assistant**: "I'm checking our maintenance schedules... I found 3 vehicles requiring service:
- VH-001: Oil change due in 2 days
- VH-005: Tire rotation overdue by 1 week  
- VH-009: Annual inspection due tomorrow

Would you like me to schedule these services?"

**Actions**: 
- [View VH-001 Details]
- [View VH-005 Details]
- [View VH-009 Details]

### Example 2: Compliance Query
**User**: "Validate BG for SIT Arabian Contracting"

**Assistant**: "I'm looking for Bank Guarantee information for SIT Arabian Contracting... I found their compliance record:
- Entity: SIT Arabian Contracting
- BG Status: Valid
- Expiry Date: 2025-12-31
- Amount: $250,000

The bank guarantee is currently valid and compliant."

**Actions**:
- [View Full Compliance Record]
- [Download BG Document]

### Example 3: Warehouse Query
**User**: "Which warehouses are running low on stock?"

**Assistant**: "Checking inventory levels across all warehouses... I found 2 warehouses with low stock:
- Dubai Warehouse: 15% capacity (1,500 kg / 10,000 kg)
- Sharjah Warehouse: 22% capacity (2,200 kg / 10,000 kg)

Would you like to initiate a restock order?"

**Actions**:
- [View Dubai Warehouse]
- [View Sharjah Warehouse]
- [Create Restock Order]

## Empathetic Responses

When data is missing, the assistant provides helpful alternatives:

**Instead of**: "No data found"

**It says**: "I'm checking our system for that information, but I don't see it in recent records. It might have been completed already, or the reference number might be slightly different. Can you double-check the details?"

## Future Enhancements

- [ ] Conversation persistence (save to database)
- [ ] Multi-language support
- [ ] File attachment support
- [ ] Screenshot analysis
- [ ] Voice command shortcuts
- [ ] Assistant customization (voice, personality)
- [ ] Usage analytics and insights
- [ ] Proactive suggestions based on patterns
- [ ] Integration with external APIs
- [ ] Custom action definitions per user

## Configuration

### Environment Variables Required
- `LOVABLE_API_KEY` - For AI responses
- `OPENAI_API_KEY` - For TTS and voice features
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Admin database access

### Supabase Config
All assistant functions are configured in `supabase/config.toml`:
```toml
[functions.unified-assistant]
verify_jwt = true

[functions.text-to-speech]
verify_jwt = true

[functions.assistant-actions]
verify_jwt = true
```

## Best Practices

1. **Keep queries specific** - Include IDs, names, or dates for better results
2. **Use suggested queries** - Pre-configured for optimal results
3. **Enable voice output** - Better multitasking while listening
4. **Export important conversations** - Save for reference or documentation
5. **Use keyboard shortcuts** - Faster access to assistant
6. **Execute suggested actions** - One-click to perform tasks
7. **Provide feedback** - Help improve AI responses

## Troubleshooting

### Voice not working
- Check microphone permissions in browser
- Verify OpenAI API key is configured
- Check browser console for errors

### Actions not executing
- Verify JWT token is valid
- Check user has required permissions
- Ensure database connection is active

### Slow responses
- May indicate API rate limiting
- Check network connection
- Try text chat instead of voice

### Context not loading
- Verify RLS policies allow data access
- Check user role permissions
- Review edge function logs
