import type { TokenPayload } from './token-payload.ts'

declare global {
    namespace Express {
        // On rajoute user au type Request de express
        interface Request {
            cookies?: Record<string, string>
            user?: TokenPayload // Il peut y avoir un req.user
        }
    }
}

export {}