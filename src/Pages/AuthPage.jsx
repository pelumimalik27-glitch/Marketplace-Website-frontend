import React, { useState, useContext } from 'react'
import { AppContext } from '../contexts/AppContext';
import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Store, User, Shield } from 'lucide-react';
import { ArrowLeftCircle } from 'lucide-react';
import { buildApiUrl } from "../lib/api";
function AuthPage() {
  const { handleLogin } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const location = useLocation();
  const modeFromUrl = searchParams.get("mode");
  const modeFromState = location.state?.mode;
  const preferredMode = modeFromUrl || modeFromState;
  const redirectTo = location.state?.redirectTo || "/";
  const prefilledEmail = location.state?.email || "";
  const otpVerified = Boolean(location.state?.otpVerified);
  const [isLogin, setIsLogin] = useState(preferredMode !== "register");
  const isAdminFlow = (roleFromUrl || "buyer").toLowerCase() === "admin";
  const isCompact = isLogin || isAdminFlow;
  
  
  const [formData, setFormData] = useState({
    name: '',
    email:"",
    password: '',
    role: roleFromUrl || "buyer"
  });
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (prefilledEmail) {
      setFormData((prev) => ({ ...prev, email: prefilledEmail }));
    }
    if (otpVerified) {
      setInfo("OTP verified successfully. Please login.");
      setIsLogin(true);
    }
  }, [prefilledEmail, otpVerified]);
  
  const handleSubmit = async(e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    
    if (!formData.email || !formData.password) {
      setError('Email and Password required');
      return;
    }

    if (!isLogin && !formData.name) {
      setError("Name is required")
      return
    }

    if (!isLogin && isAdminFlow) {
      setError("Admin registration is disabled. Use admin login.");
      return;
    }

    const endpoint = isLogin
      ? isAdminFlow
        ? buildApiUrl("/auth/admin/login")
        : buildApiUrl("/auth/login")
      : buildApiUrl("/auth/register");
    
  try {
    
    const response = await fetch (endpoint,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        name:formData.name,
        email: formData.email,
      password: formData.password
      })
    })

      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (_) {
          data = {};
        }
      }

    if(!response.ok){
      const fallbackMessage = `${isLogin ? "Login" : "Registration"} failed (HTTP ${response.status})`;
      return setError(data?.message || data?.error || rawText || fallbackMessage)
    }

    if (!isLogin) {
      const signupEmail = data?.data?.user?.email || formData.email;
      if (!signupEmail) {
        setError("Registration succeeded but email is missing. Please use Verify Email With OTP.");
        return;
      }

      navigate("/verify-otp", {
        replace: true,
        state: {
          email: signupEmail,
          autoSent: false,
          fromSignup: true,
          mode: "verify",
        },
      });
      return;
    }

    if (!data?.data?.accessToken || !data?.data?.user) {
      setError("Unexpected server response. Please try again.");
      return;
    }

    handleLogin({
      token:data.data.accessToken,
      refreshToken: data?.data?.refreshToken,
      user:data.data.user
    })
    
    const roles = data?.data?.user?.roles || [];

    if (redirectTo && redirectTo !== "/") {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (roles.includes("admin")) {
      navigate("/admin/dashboard", { replace: true });
    } else if (roles.includes("seller")) {
      navigate("/seller", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
    
  }catch (error) {
    console.error(error)
     setError(
      error?.message
        ? `Could not reach server (${error.message}). Check backend is running.`
        : "Could not reach server. Check backend is running."
     );
  }
  } 
    
 

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-orange-100 px-3 py-4 sm:px-4 sm:py-5">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-3 inline-flex items-center text-orange-800 transition hover:text-orange-900"
        >
          <ArrowLeftCircle size={30} className="cursor-pointer" />
        </button>
        
        <div className={`text-center ${isCompact ? "mb-4 sm:mb-5" : "mb-6 sm:mb-8"}`}>
          <div className={`inline-flex items-center justify-center rounded-full bg-orange-600 ${isCompact ? "mb-3 h-12 w-12" : "mb-4 h-14 w-14 sm:h-16 sm:w-16"}`}>
            <Store size={isCompact ? 22 : 28} className="text-white sm:h-8 sm:w-8" />
          </div>
          <h1 className={`${isCompact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"} font-bold text-gray-900`}>Elite Marketplace</h1>
          <p className="mt-1.5 text-sm text-gray-600 sm:text-base">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>
        
      
        <div className="rounded-2xl bg-white p-4 shadow-xl sm:p-5">
          <form onSubmit={handleSubmit} className={isCompact ? "space-y-4" : "space-y-5 sm:space-y-6"}>
              {
                !isLogin && (
                    <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData,name:e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-transparent focus:ring-2 focus:ring-orange-500 sm:text-base"
                placeholder="Enter your username"
              />
            </div>
                )
              }
            <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
           Email
        </label>
       <input
       type="email"
       value={formData.email}
      onChange={(e) =>
        setFormData({ ...formData, email: e.target.value })
        }
      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm sm:text-base"
        placeholder="Enter your email"
  />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-transparent focus:ring-2 focus:ring-orange-500 sm:text-base"
                placeholder="Enter your password"
              />
            </div>
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password", { state: { email: formData.email } })}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            {info && (
              <div className="text-emerald-700 text-sm bg-emerald-50 p-3 rounded-lg">
                {info}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 sm:text-base"
            >
              {isLogin ? "Sign In" : "Register"} as{" "}
            {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
            </button>
            {!isAdminFlow && (
              <button
                type="button"
                onClick={() => navigate("/verify-otp", { state: { email: formData.email } })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:text-base"
              >
                Verify Email With OTP
              </button>
            )}
            <div className='text-center mt-4'>
              <button
                type='button'
                onClick={() => {
                  if (isAdminFlow) return;
                  setIsLogin(!isLogin);
                  setFormData({ ...formData, name: "" });
                }}
                className='text-orange-600 text-sm'
              >
              <p className="text-gray-600 mt-2">
              {isAdminFlow
                ? "Admin accounts can only sign in"
                : isLogin
                  ? "Don't have an account? Register"
                  : "Already have an account? Sign in"}
            </p>
              </button>
            </div>
          </form>
          
          <div className={`${isCompact ? "mt-4 pt-4" : "mt-6 pt-6"} border-t border-gray-200`}>
            <p className="text-center text-gray-600 text-sm">
              By signing in, you agree to our{' '}
              <a href="#" className="text-orange-600 hover:text-orange-700">Terms</a> and{' '}
              <a href="#" className="text-orange-600 hover:text-orange-700">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
      </div>
  );
}

export default AuthPage;
