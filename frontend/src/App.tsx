import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { BoardProvider } from './hooks/useBoard';
import { ToastProvider } from './hooks/useToast';
import { AllTasksPage } from './pages/AllTasksPage';
import { BoardPage } from './pages/BoardPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <BoardProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/board" replace />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/tasks" element={<AllTasksPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/board" replace />} />
            </Route>
          </Routes>
        </BoardProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}