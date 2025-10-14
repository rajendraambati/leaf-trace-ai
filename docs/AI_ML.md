# AI/ML Documentation

## AI Features

### 1. AI Grading (Image Analysis)
- **Primary**: Azure ML custom model
- **Fallback**: Google Gemini 2.5 Flash via Lovable AI
- **Input**: Tobacco leaf images
- **Output**: Grade, quality score, defects, recommendations

### 2. Route Optimization
- **Model**: Google Gemini 2.5 Flash
- **Input**: Shipments, vehicles, constraints
- **Output**: Optimized routes with ETAs

### 3. ESG Scoring
- **Model**: Google Gemini 2.5 Flash
- **Input**: Entity data, certifications, practices
- **Output**: Environmental, Social, Governance scores

### 4. Crop Health Prediction
- **Model**: Azure ML custom model
- **Input**: Sensor data, historical data
- **Output**: Health score, disease risk, yield prediction

## Lovable AI Gateway

**Base URL**: `https://ai.gateway.lovable.dev/v1/chat/completions`

**Available Models**:
- `google/gemini-2.5-pro` - Advanced reasoning
- `google/gemini-2.5-flash` - Balanced (default)
- `google/gemini-2.5-flash-lite` - Fast/cheap
- `openai/gpt-5` - Advanced multimodal
- `openai/gpt-5-mini` - Efficient
- `openai/gpt-5-nano` - Speed optimized

**Usage Example**:
```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'You are an AI assistant...' },
      { role: 'user', content: 'Analyze this data...' }
    ]
  })
});
```

## Analytics Tracking

All AI requests logged to `ai_usage_analytics` for performance monitoring and model improvement.

## Model Retraining

Based on user feedback and acceptance rates. See Analytics Dashboard for insights.
