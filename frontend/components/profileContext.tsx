import { createContext, useContext } from "react";

type ProfileContextType = {
    reloadProfile: () => Promise<void>;
};

export const ProfileContext = createContext<ProfileContextType>({
    reloadProfile: async () => {},
});

export const useProfile = () => useContext(ProfileContext);