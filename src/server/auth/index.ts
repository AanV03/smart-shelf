import { getServerSession } from "next-auth";
import { cache } from "react";

import { authOptions } from "./config";

const auth = cache(() => getServerSession(authOptions));

// Alias for compatibility
const getServerAuthSession = auth;

export { auth, authOptions, getServerAuthSession };
