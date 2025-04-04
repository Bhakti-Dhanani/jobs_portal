// import { Strapi } from '@strapi/strapi';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  provider: string;
  confirmed: boolean;
  role?: {
    id: number;
    name: string;
  };
}

export interface AuthContext {
  request: {
    body: {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
      identifier?: string;
    };
  };
  badRequest: (message: string) => void;
  created: (data: any) => void;
  send: (data: any) => void;
} 