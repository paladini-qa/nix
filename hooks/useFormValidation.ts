import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { getErrorMessages, getFirstError } from "../schemas";

interface UseFormValidationOptions<T extends z.ZodSchema> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
}

interface FieldError {
  message: string;
  hasError: boolean;
}

/**
 * Hook para validação de formulários com Zod
 */
export function useFormValidation<T extends z.ZodSchema>(
  options: UseFormValidationOptions<T>
) {
  const { schema, onSubmit } = options;
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Valida um campo individual
  const validateField = useCallback(
    (field: string, value: unknown): FieldError => {
      try {
        // Cria um schema parcial para o campo
        const fieldSchema = (schema as z.ZodObject<any>).shape?.[field];
        if (fieldSchema) {
          fieldSchema.parse(value);
          // Remove erro se válido
          setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
          return { message: "", hasError: false };
        }
        return { message: "", hasError: false };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const message = error.errors[0]?.message || "Invalid value";
          setErrors((prev) => ({ ...prev, [field]: message }));
          return { message, hasError: true };
        }
        return { message: "", hasError: false };
      }
    },
    [schema]
  );

  // Valida todos os campos
  const validateAll = useCallback(
    (data: unknown): boolean => {
      const result = schema.safeParse(data);
      if (result.success) {
        setErrors({});
        return true;
      }
      setErrors(getErrorMessages(result.error));
      return false;
    },
    [schema]
  );

  // Handler de submit
  const handleSubmit = useCallback(
    async (data: unknown) => {
      setSubmitError(null);
      const result = schema.safeParse(data);

      if (!result.success) {
        setErrors(getErrorMessages(result.error));
        return false;
      }

      setErrors({});
      setIsSubmitting(true);

      try {
        await onSubmit(result.data);
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        setSubmitError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [schema, onSubmit]
  );

  // Retorna erro de um campo específico
  const getFieldError = useCallback(
    (field: string): FieldError => {
      const message = errors[field] || "";
      return { message, hasError: !!message };
    },
    [errors]
  );

  // Props para TextField do MUI
  const getFieldProps = useCallback(
    (field: string) => {
      const error = errors[field];
      return {
        error: !!error,
        helperText: error || "",
      };
    },
    [errors]
  );

  // Limpa erros
  const clearErrors = useCallback(() => {
    setErrors({});
    setSubmitError(null);
  }, []);

  // Limpa erro de um campo
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Verifica se tem erros
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  return {
    errors,
    submitError,
    isSubmitting,
    hasErrors,
    validateField,
    validateAll,
    handleSubmit,
    getFieldError,
    getFieldProps,
    clearErrors,
    clearFieldError,
  };
}

export default useFormValidation;




