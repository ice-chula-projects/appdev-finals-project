import { createContext, useContext } from "react";

type AcountContextType = {
    reloadProfile: () => Promise<void>;
    logout: () => Promise<void>;
};

export const AccountContext = createContext<AcountContextType>({
    reloadProfile: async () => {},
    logout: async () => {}
});

export const useAccount = () => useContext(AccountContext);