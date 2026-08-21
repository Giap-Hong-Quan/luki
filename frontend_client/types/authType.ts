export interface SigninPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}
export interface RegisterResponse {
  success: boolean;
  message: string;
  data:any;
}
