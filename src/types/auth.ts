// ---------- /singup ----------

export interface SignUpRequest {
  email: string;
  name: string;
  password: string;
  profileImage?: string;
}

export interface SignUpResponse {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
}

// ---------- /logout ----------

export interface LogoutResponse {
  message: string;
}

// ---------- /login ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}
