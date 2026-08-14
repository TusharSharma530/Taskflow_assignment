import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { BoardProvider } from './hooks/useBoard';
import { ToastProvider } from './hooks/useToast';
import { AllTasksPage } from './pages/AllTasksPage';
import { BoardPage } from './pages/BoardPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { DeleteTaskPage } from './pages/DeleteTaskPage';
import { EditTaskPage } from './pages/EditTaskPage';
import { SettingsPage } from './pages/SettingsPage';

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/board" replace /> },
      { path: 'board', element: <BoardPage /> },
      { path: 'tasks', element: <AllTasksPage /> },
      { path: 'tasks/new', element: <CreateTaskPage /> },
      { path: 'tasks/:taskId/edit', element: <EditTaskPage /> },
      { path: 'tasks/:taskId/delete', element: <DeleteTaskPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/board" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <ToastProvider>
      <BoardProvider>
        <RouterProvider router={router} />
      </BoardProvider>
    </ToastProvider>
  );
}