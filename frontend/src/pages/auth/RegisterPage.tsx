import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <AuthLayout
      title="Daftar Akun Koleksi"
      subtitle="Bergabunglah dengan CD'E Pearls Lombok Atelier dan temukan keindahan mutiara laut selatan Lombok bersertifikat keaslian."
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
