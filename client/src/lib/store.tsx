import { createContext, useContext, useReducer, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  fullName: string;
  studentId?: string | null;
  role: string;
  loyaltyPoints?: number;
  createdAt?: any;
}

interface StoreState {
  user: User | null;
  cartCount: number;
}

type StoreAction = 
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_CART_COUNT"; payload: number };

const initialState: StoreState = {
  user: null,
  cartCount: 0,
};

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_CART_COUNT":
      return { ...state, cartCount: action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
