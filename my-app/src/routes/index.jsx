import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import HomePage from '../pages/HomePage';
import PaperList from '../pages/PaperList';
import PaperDetail from '../pages/PaperDetail';
import Profile from '../pages/Profile';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/papers" element={<PaperList />} />
        <Route path="/papers/:id" element={<PaperDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;