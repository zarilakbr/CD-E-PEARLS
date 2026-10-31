import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <AuthLayout
      title="Masuk ke Akun"
      subtitle="Selamat datang di butik resmi CD'E Pearls Lombok. Masuk untuk mengelola pesanan dan koleksi perhiasan mutiara Anda."
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
