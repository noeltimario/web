import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "@/integrations/supabase/client"; // This now exports Firebase auth
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";

type AppRole = "student" | "staff" | "admin";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Use your Render backend URL from .env
  const API_URL = import.meta.env.VITE_API_URL || "https://uc-smarthelp-main.onrender.com";

  const fetchUserData = async (firebaseUser: User) => {
    try {
      // Fetch profile and roles from your MySQL backend
      const response = await fetch(`${API_URL}/api/user-profile?email=${firebaseUser.email}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setRoles(data.roles || ["student"]);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
