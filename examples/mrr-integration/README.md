# MRR User Guide Integration (React)

Drop-in **User Guide** tab for the MRR application (or any app) using the read-only View API.

## Quick start

### 1. Copy files into your React app

```
examples/mrr-integration/
├── viewApiClient.js    → src/integrations/userGuide/viewApiClient.js
├── UserGuideTab.jsx    → src/integrations/userGuide/UserGuideTab.jsx
└── index.js
```

### 2. Install dependency

```bash
npm install lucide-react
```

Uses **Tailwind CSS** for styling (same utility classes as the User Guide viewer).

### 3. Get a read-only API key

From the User Guide admin server (internal):

```http
POST /api/api-keys
Content-Type: application/json

{ "name": "MRR Production", "applicationId": null }
```

Store the returned `apiKey` securely (environment variable).

### 4. Embed in MRR

```jsx
import { UserGuideTab } from './integrations/userGuide'

function MrrApp() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div>
      <nav>
        <button onClick={() => setTab('dashboard')}>Dashboard</button>
        <button onClick={() => setTab('user-guide')}>User Guide</button>
      </nav>

      {tab === 'user-guide' && (
        <UserGuideTab
          apiBaseUrl={import.meta.env.VITE_UGMS_VIEW_API_URL}
          apiKey={import.meta.env.VITE_UGMS_API_KEY}
          applicationCode="MRR"
          appTitle="MRR"
        />
      )}
    </div>
  )
}
```

### Environment variables

```env
VITE_UGMS_VIEW_API_URL=http://localhost:3001/api/v1/view
VITE_UGMS_API_KEY=ug_your_read_only_key_here
```

Production:

```env
VITE_UGMS_VIEW_API_URL=https://guides.yourcompany.com/api/v1/view
VITE_UGMS_API_KEY=ug_production_key
```

## API calls used

| User action        | API endpoint                                      |
|--------------------|---------------------------------------------------|
| Open tab           | `GET /applications/MRR`                           |
| Click module       | `GET /modules/:moduleId/screens`                  |
| Open guide         | `GET /screens/:screenId`                          |
| Images / videos    | Pre-signed URLs in response (`step.image.url`)    |

## Other applications

Change `applicationCode` only:

```jsx
<UserGuideTab applicationCode="STORE" appTitle="Store" ... />
<UserGuideTab applicationCode="HR" appTitle="HR" ... />
```

## Security notes

- Never expose the API key in client-side code for public websites; proxy through your backend if needed.
- For internal enterprise apps (MRR desktop/web on VPN), env-based keys are acceptable.
- The View API is **read-only** — no admin or write operations.
