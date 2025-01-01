# Sales Prompt Creator - Architecture Documentation

## Overview
A single-page Next.js application that replaces the Make.com automation for generating AI sales representative prompts. The application is entirely client-side, with no backend requirements, making it simple to deploy and maintain.

## Core Technologies
- **Framework**: Next.js with App Router
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form with Zod validation
- **API Integration**: OpenAI SDK
- **State Management**: Local storage for API key persistence

## Component Structure

### Pages
- `app/page.tsx`: Main application page
  - Houses the entire application in a single view
  - Manages client-side state and form submission logic

### Components
1. **Core Components** (`components/`)
   - `prompt-container.tsx`: Main application container
   - `prompt-form.tsx`: Main form container with form logic
   - `form-fields.tsx`: Form field definitions and layouts
   - `form-controls.tsx`: Form control buttons and actions
   - `generated-prompt.tsx`: Display area for generated prompts
   - `model-config.tsx`: OpenAI model configuration and API key management
   - `prompt-actions.tsx`: Actions for generated prompts (copy, regenerate)
   - `prompt-history.tsx`: Management of previously generated prompts

2. **UI Components** (`components/ui/`)
   - Utilizes shadcn/ui components including:
     - Form controls (input, textarea, select)
     - Layout components (card, tabs, collapsible)
     - Feedback components (alert, toast, tooltip)
     - Interactive elements (button, separator)

### Type Definitions (`types/`)
```typescript
interface FormData {
  aiName: string;
  companyName: string;
  industry: string;
  targetAudience: string;
  challenges: string;
  product: string;
  objective: string;
  objections: string;
  additionalInfo?: string;
}

interface OpenAIConfig {
  apiKey: string;
  model: string;
}
```

### Utilities (`lib/`)
- `openai.ts`: OpenAI API integration, prompt generation, and model configuration
- `utils.ts`: Common utility functions and helpers

## Data Flow
1. User enters OpenAI API key (stored in localStorage)
2. User fills out the form with company and sales context
3. Form data is validated using Zod
4. On submission:
   - OpenAI API is called directly from the client
   - Generated prompt is displayed in the result area
   - Option to copy or regenerate is provided

## UI Components Used (shadcn/ui)
- `Form`: Form layout and validation
- `Input`: Text input fields
- `Textarea`: Longer text inputs
- `Button`: Form submission and actions
- `Card`: Layout containers
- `Select`: Model selection
- `Alert`: Error messages
- `Toast`: Success/failure notifications

## Security Considerations
- OpenAI API key is stored only in the client's localStorage
  - Appropriate for user-provided third-party API keys
  - Protected by Next.js XSS prevention
  - Limited to browser extension and dev tools access
  - Users informed via UI tooltips
- No server-side storage or processing
- All API calls are made directly from the client to OpenAI
- Input validation to prevent malicious content
- No third-party script execution

## Performance Optimizations
- Client-side rendering for instant feedback
- Form field validation on blur
- Debounced API calls
- Proper error handling with user feedback

## Implemented Features
- Complete form-based prompt generation
- OpenAI model selection and configuration
- Prompt history with local storage
- Copy and regenerate functionality
- Rich error handling and user feedback

## Future Considerations
- Export/import functionality
- Template management
- A/B testing different prompt structures
