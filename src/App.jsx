import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GuideProvider } from './context/GuideContext'
import { ThemeProvider } from './context/ThemeContext'
import { RoleProvider } from './context/RoleContext'
import AppLayout from './components/layout/AppLayout'
import AdminGuard from './components/layout/AdminGuard'
import ViewerLayout from './components/viewer/ViewerLayout'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import Modules from './pages/Modules'
import Guides from './pages/Guides'
import GuideEditorPage from './pages/GuideEditorPage'
import MediaLibrary from './pages/MediaLibrary'
import Settings from './pages/Settings'
import ApiKeys from './pages/ApiKeys'
import ViewerHome from './pages/viewer/ViewerHome'
import ViewerApp from './pages/viewer/ViewerApp'
import ViewerGuide from './pages/viewer/ViewerGuide'

function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <GuideProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/viewer" element={<ViewerLayout />}>
                <Route index element={<ViewerHome />} />
                <Route path="app/:appId" element={<ViewerApp />} />
                <Route path="app/:appId/module/:moduleId" element={<ViewerApp />} />
                <Route
                  path="app/:appId/module/:moduleId/guide/:guideId"
                  element={<ViewerGuide />}
                />
                <Route path="app/:appId/guide/:guideId" element={<ViewerGuide />} />
              </Route>

              <Route element={<AdminGuard />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="modules" element={<Modules />} />
                  <Route path="guides" element={<Guides />} />
                  <Route path="guides/new" element={<GuideEditorPage />} />
                  <Route path="guides/edit/:id" element={<GuideEditorPage />} />
                  <Route path="videos" element={<MediaLibrary key="videos" />} />
                  <Route path="photos" element={<MediaLibrary key="photos" />} />
                  <Route path="documents" element={<MediaLibrary key="documents" />} />
                  <Route path="content" element={<MediaLibrary key="content" />} />
                  <Route path="api-keys" element={<ApiKeys />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </GuideProvider>
      </RoleProvider>
    </ThemeProvider>
  )
}

export default App
