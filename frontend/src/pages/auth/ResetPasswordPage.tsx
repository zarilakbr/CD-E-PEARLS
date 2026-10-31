import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';

export const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout
      title="Kata Sandi Baru"
      subtitle="Perbarui kata sandi akun butik Anda untuk melanjutkan penjelajahan koleksi mutiara."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
