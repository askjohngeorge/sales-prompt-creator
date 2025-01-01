# Sales Prompt Creator

A modern web application for generating AI sales representative prompts. Built with Next.js and OpenAI, this tool helps create customized, context-aware prompts for sales conversations.

## Features

- 🤖 OpenAI-powered prompt generation
- 💾 Local prompt history
- 🎯 Customizable sales context and objectives
- 🔒 Secure API key management
- 📱 Responsive design
- ⚡ Real-time prompt generation

## Security Considerations

- API keys are stored in browser localStorage for user convenience
- This storage method is appropriate for user-provided third-party API keys
- Users should be aware that browser extensions and dev tools can access stored keys
- Ensure you trust the authors of your extensions, and anyone you allow to use your computer
- Consider entering keys each session if preferred
- Recommended to use dedicated API keys for this application

## Try It Out

This project is deployed on Vercel. Click [here](https://sales-prompt-creator.vercel.app/) to try it out.

## Demo

[![Talk to Your Sales Prompts! Vapi-Powered AI Conversations in Next.js via #Windsurf](https://img.youtube.com/vi/Q1sEkoNmpkk/maxresdefault.jpg)](https://www.youtube.com/watch?v=Q1sEkoNmpkk)

## Prerequisites

- Node.js 18.x or later
- OpenAI API key
- pnpm (recommended) or npm

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sales-prompt-creator.git
cd sales-prompt-creator
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Enter your OpenAI API key (stored securely in your browser's local storage)
2. Fill in the form with your sales context:
   - Company and product information
   - Target audience
   - Common challenges and objections
   - Sales objectives
3. Generate your customized sales prompt
4. Copy, regenerate, or save prompts to your history

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) with App Router
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Form Management**: React Hook Form with Zod validation
- **API Integration**: OpenAI SDK

## Development

The project uses modern development practices:

```bash
pnpm dev     # Start development server
pnpm build   # Create production build
pnpm start   # Start production server
pnpm lint    # Run ESLint
```

## Deployment

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository
2. Import your project to Vercel
3. Deploy!

No environment variables are needed as all configuration (including the OpenAI API key) is stored securely in the browser's localStorage.

For more deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed documentation about the project structure and components.

## License

[MIT](LICENSE)
