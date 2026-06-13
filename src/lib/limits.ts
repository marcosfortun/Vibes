// Límites de caracteres al crear una recomendación. Compartidos entre el
// formulario (maxLength) y la validación de la server action.
export const LIMITS = {
  title: 120,
  description: 600,
  url: 500,
  tag: 30,
} as const;
