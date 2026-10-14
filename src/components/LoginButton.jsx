import React, { useState } from 'react';
import { MicrosoftIcon } from './Icons';
import LoginModal from './LoginModal';

/**
 * Componente de botón para iniciar sesión con Microsoft Entra ID (Azure AD).
 * Al hacer clic, abre la pestaña / modal de autenticación corporativa.
 */
export const LoginButton = ({ onLoginSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="btn btn-microsoft" 
        onClick={() => setIsModalOpen(true)}
        title="Abrir pestaña de inicio de sesión de Microsoft Entra ID"
      >
        <MicrosoftIcon size={18} />
        <span>Iniciar Sesión con Microsoft</span>
      </button>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={onLoginSuccess}
      />
    </>
  );
};

export default LoginButton;
