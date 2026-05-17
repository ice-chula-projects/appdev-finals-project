import { createContext, useContext } from "react";

type ApiContextType = {
    apiUrl: string
};

export const ApiContext = createContext<ApiContextType>({
    apiUrl: null
});

export const useApiContext = () => useContext(ApiContext);