"use server";
import { auth } from "./auth"
 
export const signIn = async () => {
    await auth.api.signInSocial({
        body: {
            provider: "google",
        }
    })
}