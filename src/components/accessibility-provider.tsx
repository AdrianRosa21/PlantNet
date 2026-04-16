"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AccessibilityContextType {
  isAccessibleMode: boolean;
  isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  isAccessibleMode: false,
  isLoading: true,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [isAccessibleMode, setIsAccessibleMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      setIsAccessibleMode(false);
      return;
    }

    const checkAccessibility = async () => {
      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          router.push("/onboarding");
          return;
        }

        const data = userSnap.data();
        const { nivel_tecnologico, fecha_nacimiento } = data;

        if (!nivel_tecnologico && !fecha_nacimiento) {
           router.push("/onboarding");
           return;
        }
        
        let accessible = false;

        if (nivel_tecnologico === "basico") {
          accessible = true;
        } else if (fecha_nacimiento) {
          // Calcular edad
          const birthDate = new Date(fecha_nacimiento);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age >= 50) {
            accessible = true;
          }
        }

        setIsAccessibleMode(accessible);
        
        if (accessible) {
          document.documentElement.classList.add("senior-mode");
        } else {
          document.documentElement.classList.remove("senior-mode");
        }
      } catch (error) {
        console.error("Error fetching accessibility profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccessibility();

    return () => {
      document.documentElement.classList.remove("senior-mode");
    };
  }, [user, firestore]);

  return (
    <AccessibilityContext.Provider value={{ isAccessibleMode, isLoading }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
