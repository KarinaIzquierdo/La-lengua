// Tipos TypeScript
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  level: string;
  reason: string;
  source: string;
  contactMethod: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// URL del backend
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

/**
 * Envía un email usando Django Backend
 * @param {FormData} formData - Datos del formulario de contacto
 * @returns {Promise<EmailResponse>} - Promesa que resuelve cuando el email se envía
 */
export const sendContactEmail = async (formData: FormData): Promise<EmailResponse> => {
  try {
    const response = await fetch(`${API_URL}/contact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Email enviado exitosamente:', data);
      return { success: true, message: data.message || 'Email enviado correctamente' };
    } else {
      console.error('Error al enviar email:', data);
      return { 
        success: false, 
        message: data.message || 'Error al enviar el email. Por favor, intenta nuevamente.' 
      };
    }

  } catch (error) {
    console.error('Error al enviar email:', error);
    return { 
      success: false, 
      message: 'Error al enviar el email. Por favor, intenta nuevamente.' 
    };
  }
};

/**
 * Valida que todos los campos requeridos estén completos
 * @param {FormData} formData - Datos del formulario
 * @returns {ValidationResult} - Resultado de la validación
 */
export const validateFormData = (formData: FormData): ValidationResult => {
  const requiredFields = ['firstName', 'lastName', 'email'];
  const missingFields = [];

  requiredFields.forEach(field => {
    const fieldValue = formData[field as keyof FormData];
    if (!fieldValue || fieldValue.trim() === '') {
      missingFields.push(field);
    }
  });

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    return {
      isValid: false,
      message: 'Por favor, ingresa un email válido'
    };
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: 'Por favor, completa todos los campos requeridos'
    };
  }

  return { isValid: true };
};

// NOTA: Los emails de recuperación de contraseña y bienvenida
// ahora se envían automáticamente desde el backend Django.
// No es necesario llamarlos desde el frontend.
