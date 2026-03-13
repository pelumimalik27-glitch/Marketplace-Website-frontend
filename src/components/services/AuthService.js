

export const LogoutUser = ()=>{
    localStorage.removeItem("userToken")
}

export const checkAuthStatus = ()=>{
    return localStorage.getItem("userToken") !== null;
}