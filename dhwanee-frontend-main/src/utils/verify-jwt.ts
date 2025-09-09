/**
 * 
 * @param jwt the object containing the access and refresh tokens
 * @returns can return either -1, 0 or 1. -1 = access expired, refresh ok. 0 = both expired. 1 = access ok.
 */
export default function verifyJwt(jwt: {access: string, refresh: string}): number {
    const access = JSON.parse(atob(jwt.access.split(".")[1]))
    const refresh = JSON.parse(atob(jwt.refresh.split(".")[1]))
    if (access['iat']*1000 > new Date().getTime()) {
        return 0;
    }
    if (access['exp']*1000 < new Date().getTime()) {
        if (refresh['exp']*1000 < new Date().getTime()) {
            return 0;
        }
        return -1;
    }
    return 1;
}