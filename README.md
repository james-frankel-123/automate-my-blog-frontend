# AutoBlog Frontend

A beautiful, modern React application for AutoBlog - an AI-powered platform that automates blog content creation from inspiration discovery to publication. This frontend provides an intuitive interface for managing content workflows, analyzing performance, and customizing your brand voice.

## What is AutoBlog?

AutoBlog transforms content creation from manual work into intelligent automation. It handles the entire content pipeline:

- **Inspiration Discovery** - Finds trending topics in your industry
- **Content Strategy** - Creates SEO-optimized content briefs
- **Content Generation** - Writes compelling, brand-aligned articles using AI
- **Visual Creation** - Generates contextual images and graphics
- **Quality Assurance** - Ensures brand consistency and accuracy
- **Publishing** - Deploys content to your website with performance tracking

## Features

✨ **Rich Content Editor** - Powered by Tiptap with full formatting, tables, images, and more  
📊 **Analytics Dashboard** - Track performance, engagement, and content metrics  
🎨 **Brand Customization** - Configure voice, style, and visual identity  
🔄 **Workflow Management** - Step-by-step content creation workflow  
👥 **Multi-tenant Support** - Manage multiple brands and projects  
📱 **Responsive Design** - Works beautifully on desktop, tablet, and mobile  
🔐 **Authentication** - Secure user management and access control  

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn)
- A backend API server running (see backend configuration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/automate-my-blog-frontend.git
cd automate-my-blog-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see `.env.example` for `REACT_APP_API_URL` and optional `REACT_APP_STREAMING_ENABLED`):
```bash
cp .env.example .env
# Edit .env with your API base URL and options
```

4. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner in interactive watch mode
- `npm run build` - Builds the app for production
- `npm run test:e2e` - Runs end-to-end tests with Playwright
- `npm run test:e2e:ui` - Opens Playwright UI for debugging tests
- `npm run lint` - Runs ESLint on the codebase

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth/          # Authentication modals
│   ├── Dashboard/     # Dashboard tabs and analytics
│   ├── Editor/        # Rich text editor components
│   ├── Workflow/      # Content workflow steps
│   └── ...
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── utils/             # Utility functions
└── styles/            # Global styles and design system
```

## Tech Stack

- **React 19** - Modern React with hooks
- **Ant Design** - UI component library
- **Tiptap** - Rich text editor framework
- **Framer Motion** - Smooth animations
- **Playwright** - End-to-end testing
- **React Testing Library** - Component testing

## Development

### Code Style

This project uses ESLint with React app defaults. Run `npm run lint` to check for issues.

### Testing

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Coverage: `npm run test:coverage`

### Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Documentation

- [Docs index](./docs/README.md) – Vision, architecture, goals, and full doc list
- [AI swarm collaboration](./docs/AI_SWARM_COLLABORATION.md) – Multi-agent / parallel development guidelines
- [API Specification](./docs/API_SPECIFICATION.md)
- [Client Integration Guide](./docs/CLIENT_INTEGRATION.md)
- [E2E Test Setup](./docs/E2E_TEST_SETUP.md)
- [Frontend Audit & Summary](./docs/frontend-audit-summary.md) – Audit findings and work completed since audit
- [UX / Usability Proposal](./docs/GITHUB_ISSUES_FROM_USABILITY_PROPOSAL.md) – UX issues and implementation status

## License

[Add your license here]

## Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

Built with ❤️ for content creators who want to focus on what matters most.
