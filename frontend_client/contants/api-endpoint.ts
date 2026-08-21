// Khai báo tập trung toàn bộ đường dẫn API của Backend
export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh-token",
    PROFILE: "/auth/profile",
    SEND_OTP: "/auth/send-otp",
    VERIFY_OTP: "/auth/verify-otp",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  PRODUCTS: {
    GET_ALL: "/products",
    GET_BY_SLUG: (slug: string) => `/products/${slug}`,
    GET_BY_ID: (id: string) => `/products/${id}`,
  },
  CATEGORIES: {
    GET_ALL: "/categories",
    GET_BY_ID: (id: string) => `/categories/${id}`,
  },
  COLLECTIONS: {
    GET_ALL: "/collections",
    GET_BY_SLUG: (slug: string) => `/collections/${slug}`,
  },
  CART: {
    GET: "/cart",
    ADD_ITEM: "/cart/items",
    UPDATE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    CLEAR: "/cart/clear",
  },
  ORDERS: {
    CREATE: "/orders",
    GET_MY_ORDERS: "/orders/my-orders",
    GET_DETAIL: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },
  USERS: {
    UPDATE_PROFILE: "/users/profile",
    GET_ADDRESSES: "/users/addresses",
  },
} as const;