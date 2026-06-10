import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Loading from '../components/common/Loading'; // Component loading fallback (tạo mới)

const PaperList = lazy(() => import('../pages/PaperList'));

const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/papers" replace />} />
          <Route path="/papers" element={<PaperList />} />
        </Route>
        <Route path="*" element={<Navigate to="/papers" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRoutes;