# Painel Campanhas V2 — Frontend

Professional React dashboard with real-time WebSocket updates, dark theme, and responsive analytics UI.

## Quick Start

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp ../.env.example .env.local
   ```

   Required variables:
   ```
   VITE_API_URL=http://localhost:3001/api
   VITE_WS_URL=ws://localhost:3001
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Application runs on `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## Project Structure

### Directory Layout

```
frontend/
├── public/
├── src/
│   ├── App.tsx                 # Root router and layout
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles with dark theme variables
│   ├── components/
│   │   ├── Layout/
│   │   │   └── MainLayout.tsx  # Two-column layout with sidebar
│   │   ├── Dashboard/
│   │   │   ├── KPICards.tsx    # KPI cards: campaigns, IPs, blocks, risk
│   │   │   └── StatsChart.tsx  # 7-day line chart (recharts)
│   │   └── PrivateRoute.tsx    # Route protection wrapper
│   ├── contexts/
│   │   └── AuthContext.tsx     # JWT auth state, login/logout
│   ├── hooks/
│   │   └── useWebSocket.ts     # Socket.io client with reconnection
│   ├── pages/
│   │   ├── Login.tsx           # Email/password login form
│   │   └── Dashboard.tsx       # Main dashboard with KPIs and chart
│   ├── services/
│   │   └── api.ts              # Axios instance with JWT interceptors
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.ts              # Vite build configuration
├── index.html                  # HTML entry point
└── nginx.conf                  # Nginx SPA routing (production)
```

### File Responsibilities

#### App.tsx
- React Router setup with BrowserRouter
- Routes for Login (/login) and Dashboard (/)
- AuthProvider wrapper for authentication context
- PrivateRoute protection on Dashboard

#### MainLayout.tsx
- Two-column layout: sidebar + content
- Sidebar links: Dashboard, Campaigns, Analysis Logs
- Header with user name and logout button
- Responsive on mobile (sidebar becomes overlay)

#### Dashboard.tsx
- Fetches campaigns from `/api/campaigns`
- Generates mock analytics stats (7-day data)
- Displays KPICards and StatsChart
- Real-time updates via WebSocket `campaign:stats:updated`

#### KPICards.tsx
- Grid of 4 cards showing key metrics
- Active campaigns, analyzed IPs, blocked IPs, average risk score
- Trend indicators (up/down) with delta values
- Dark theme styling with cyan accents

#### StatsChart.tsx
- Recharts ResponsiveContainer with LineChart
- 7-day time series data
- Blue line: analyzed IPs, Red line: blocked IPs
- Tooltip on hover, legend, grid lines

#### AuthContext.tsx
- Manages user state, loading state, error handling
- `login(email, password)`: POST /api/auth/login, stores tokens
- `logout()`: Clears tokens, redirects to /login
- `useAuth()` hook for consuming context in components
- Axios request/response interceptors for JWT handling

#### useWebSocket.ts
- Creates Socket.io client with auto-reconnection
- Connection options: 1s initial delay, 5s max, 5 retry attempts
- `joinCampaign(campaignId)`: Emit 'join-campaign' event
- `on(event, callback)`: Subscribe to server events
- `off(event, callback)`: Unsubscribe from events
- Automatic cleanup on unmount

#### api.ts
- Axios instance with baseURL pointing to VITE_API_URL
- Request interceptor: adds `Authorization: Bearer <token>` header
- Response interceptor: handles 401 errors by clearing tokens and redirecting
- Exported as default instance for import in components/services

#### Login.tsx
- Email and password input fields
- Submit handler calls `useAuth().login()`
- Shows error messages on login failure
- Loading state on submit button
- Dark theme with cyan focus states
- Form validation: required fields

#### PrivateRoute.tsx
- Wraps protected routes
- Shows loading spinner while auth state initializes
- Redirects to /login if user not authenticated
- Renders component if authenticated

## Component Development

### Creating a New Component

1. **Create component file:**
   ```tsx
   // src/components/MyComponent.tsx
   import React from 'react';
   
   interface MyComponentProps {
     title: string;
     onAction: () => void;
   }
   
   export const MyComponent: React.FC<MyComponentProps> = ({
     title,
     onAction,
   }) => {
     return (
       <div className="bg-bg-secondary rounded-lg p-4">
         <h3 className="text-text-primary font-semibold">{title}</h3>
         <button
           onClick={onAction}
           className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
         >
           Action
         </button>
       </div>
     );
   };
   ```

2. **Export from index (optional):**
   ```tsx
   // src/components/index.ts
   export { MyComponent } from './MyComponent';
   ```

3. **Use in pages:**
   ```tsx
   import { MyComponent } from '../components/MyComponent';
   
   export const MyPage: React.FC = () => {
     return <MyComponent title="Test" onAction={() => console.log('clicked')} />;
   };
   ```

### Styling Guidelines

#### Use Tailwind Classes
All styling uses Tailwind CSS with custom dark theme configuration:

```tsx
<div className="bg-bg-primary text-text-primary border border-border rounded-lg shadow-lg p-4">
  <h2 className="text-2xl font-bold text-text-primary">Title</h2>
  <p className="text-text-muted mt-2">Muted description</p>
</div>
```

#### Theme Variables (index.css)
```css
:root {
  --bg-primary: #0f0f14;      /* Page background */
  --bg-secondary: #1a1a23;    /* Card/panel background */
  --border: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-muted: #8888aa;
  --accent: #3b82f6;          /* Primary action color (cyan) */
  --accent-hover: #2563eb;
  --error: #ef4444;
  --success: #10b981;
}
```

#### Tailwind Config Overrides
```js
// tailwind.config.js extends these colors
colors: {
  'bg': { primary: 'var(--bg-primary)', secondary: 'var(--bg-secondary)' },
  'text': { primary: 'var(--text-primary)', muted: 'var(--text-muted)' },
  'border': 'var(--border)',
  'accent': 'var(--accent)',
  'accent-hover': 'var(--accent-hover)',
}
```

### Common Patterns

#### API Calls with Loading/Error States
```tsx
import { useEffect, useState } from 'react';
import api from '../services/api';

const MyComponent: React.FC = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/api/endpoint')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-error">{error}</div>;
  return <div>{JSON.stringify(data)}</div>;
};
```

#### Using AuthContext
```tsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

#### WebSocket Real-Time Updates
```tsx
import { useWebSocket } from '../hooks/useWebSocket';

const Dashboard: React.FC = () => {
  const socket = useWebSocket();

  useEffect(() => {
    socket.joinCampaign('campaign-uuid');

    const unsubscribe = socket.on('campaign:stats:updated', (data) => {
      console.log('Stats updated:', data);
      // Update state with new data
    });

    return () => {
      unsubscribe();
      socket.off('campaign:stats:updated');
    };
  }, [socket]);

  return <div>Dashboard</div>;
};
```

## Development Guidelines

### TypeScript

All components and utilities must be TypeScript.

1. **Define prop types:**
   ```tsx
   interface MyComponentProps {
     title: string;
     count: number;
     onSubmit: (value: string) => void;
   }
   ```

2. **Use strict types:**
   ```tsx
   // ✓ Good
   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
     // ...
   };

   // ✗ Avoid
   const handleClick = (event: any) => {
     // ...
   };
   ```

3. **Export interfaces for API types:**
   ```tsx
   // src/types/index.ts
   export interface Campaign {
     id: string;
     name: string;
     status: 'active' | 'inactive';
   }
   ```

### React Hooks

Use functional components with hooks. Class components not allowed.

1. **useEffect for side effects:**
   ```tsx
   useEffect(() => {
     // Effect code
     return () => {
       // Cleanup
     };
   }, [dependencies]);
   ```

2. **useState for local state:**
   ```tsx
   const [count, setCount] = useState(0);
   ```

3. **Custom hooks for logic reuse:**
   ```tsx
   // src/hooks/useCounter.ts
   export const useCounter = (initial: number) => {
     const [count, setCount] = useState(initial);
     return { count, increment: () => setCount(c => c + 1) };
   };
   ```

### Accessibility

1. **Semantic HTML:**
   ```tsx
   // ✓ Good
   <button type="button" onClick={handleClick}>Submit</button>

   // ✗ Avoid
   <div onClick={handleClick}>Submit</div>
   ```

2. **ARIA labels for icons:**
   ```tsx
   <button aria-label="Close menu">×</button>
   ```

3. **Keyboard navigation:**
   - All clickable elements must be focusable
   - Use logical tab order
   - Implement keyboard shortcuts (e.g., Escape to close)

4. **Color contrast:**
   - Dark theme colors meet WCAG AA standards
   - Don't rely on color alone to convey information

### Performance

1. **Memoization for expensive components:**
   ```tsx
   const MyComponent = React.memo(({ data }: Props) => {
     return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
   });
   ```

2. **Lazy loading routes:**
   ```tsx
   const Dashboard = React.lazy(() => import('./pages/Dashboard'));
   ```

3. **Avoid unnecessary renders:**
   - Use dependency arrays in useEffect
   - Memoize expensive computations
   - Split large components into smaller ones

### Code Organization

1. **One component per file** (unless tightly coupled)
2. **Name files with PascalCase** (MyComponent.tsx)
3. **Group related files in directories** (components/Dashboard/, hooks/, pages/)
4. **Keep components focused and single-responsibility**

### Testing

Frontend uses integration tests via Vite dev server.

Manual testing checklist:
- [ ] All forms validate input
- [ ] Errors display clearly
- [ ] Loading states show
- [ ] WebSocket real-time updates work
- [ ] Logout clears tokens and redirects
- [ ] Responsive on mobile (test with browser dev tools)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Dark theme displays correctly

## Environment Variables

### Development (.env.local)
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### Production (.env.production)
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com
```

Use `import.meta.env.VITE_*` to access in code:
```tsx
const apiUrl = import.meta.env.VITE_API_URL;
```

## Build & Deployment

### Development Build
```bash
npm run dev
```

Vite dev server on port 3000 with HMR enabled.

### Production Build
```bash
npm run build
```

Creates optimized bundle in `dist/` directory (~150KB gzipped).

### Production Deployment

#### Docker (Recommended)
```bash
docker build -t painel-frontend .
docker run -p 3000:3000 painel-frontend
```

Uses nginx with SPA routing configured in `nginx.conf`.

#### Manual Deployment
1. Build: `npm run build`
2. Upload `dist/` to web server
3. Configure web server to serve index.html for all routes (SPA routing)

#### Nginx Configuration (Production)
```nginx
server {
  listen 3000;
  root /usr/share/nginx/html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:3001;
  }
}
```

## Troubleshooting

### Port 3000 Already in Use
```bash
npm run dev -- --port 3001
```

### WebSocket Connection Failed
Check `VITE_WS_URL` is correct and backend server is running.

### CORS Errors
Backend axios interceptor should handle this. Verify backend CORS middleware is configured.

### Login Loop
Tokens may be corrupted in localStorage. Clear and login again:
```javascript
localStorage.clear();
```

### Build Size Issues
Analyze bundle:
```bash
npm run build -- --analyze
```

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes following guidelines above
3. Test locally: `npm run dev`
4. Build for production: `npm run build`
5. Commit with clear message: `git commit -m "feat: add my feature"`
6. Push and create pull request

## License

MIT
