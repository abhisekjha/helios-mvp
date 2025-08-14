import { z } from 'zod';
import axiosInstance from '@/lib/axios';

const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export async function login(
  formData: FormData
): Promise<{ access_token: string }> {
  const response = await axiosInstance.post(
    '/api/v1/auth/login',
    formData
  );

  if (response.status !== 200) {
    throw new Error('Login failed');
  }

  const validatedToken = tokenSchema.parse(response.data);
  return validatedToken;
}