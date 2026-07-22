import { Navigate, Route, Routes } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';
import RoleGuard from '../components/RoleGuard';
import WorkbenchShell from '../layouts/WorkbenchShell';
import DashboardPage from '../pages/Dashboard';
import FlowManagerPage from '../pages/Flows';
import LoginPage from '../pages/Login';
import SystemLogsPage from '../pages/Logs';
import ProjectManagerPage from '../pages/Projects';
import GitHubConfigPage from '../pages/Settings/GitHubConfig';
import ImaConfigPage from '../pages/Settings/ImaConfig';
import LlmConfigPage from '../pages/Settings/LlmConfig';
import SkillManagerPage from '../pages/Skills';
import TemplateManagerPage from '../pages/Templates';
import UserManagerPage from '../pages/Users';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<WorkbenchShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectManagerPage />} />
          <Route path="settings/ima" element={<ImaConfigPage />} />
          <Route path="settings/llm" element={<LlmConfigPage />} />
          <Route path="settings/github" element={<GitHubConfigPage />} />
          <Route path="skills" element={<SkillManagerPage />} />
          <Route path="flows" element={<FlowManagerPage />} />
          <Route path="logs" element={<SystemLogsPage />} />
          <Route path="templates" element={<TemplateManagerPage />} />
          <Route path="users" element={<RoleGuard allow={['ADMIN']}><UserManagerPage /></RoleGuard>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
