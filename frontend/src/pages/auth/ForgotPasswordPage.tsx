import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout
      title="Atur Ulang Kata Sandi"
      subtitle="Instruksi pemulihan akun akan dikirimkan ke alamat email terdaftar Anda."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
