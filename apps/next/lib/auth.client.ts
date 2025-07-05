import { createAuthClient } from "better-auth/react"
import { toast } from "sonner";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000",
    fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
})

export const { useSession, signOut } = authClient;