import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from "./contexts/AppContext";

// Layout Components
import Layout from './components/Layout/Layout';

// Pages
import HomePage from './Pages/Home/HomePage';
import AuthPage from './Pages/AuthPage';
import RequestPasswordReset from './Pages/Auth/RequestPasswordReset';
import ResetPassword from './Pages/Auth/ResetPassword';
import ShopPage from './Pages/Product/ShopPage';
import OrderPage from './Pages/Order/OrderPage';
import TrackOrderPage from './Pages/Order/TrackOrderPage';
import ProductDetailPage from './Pages/Product/ProductDetailPage';
import CartPage from './Pages/Cart/CartPage';
import CheckoutPage from './Pages/Checkout/CheckoutPage';
import PaymentCallbackPage from './Pages/Checkout/PaymentCallbackPage';
import DisputePage from './Pages/Dispute/DisputePage';
import AdminLayout from './Pages/Admin/AdminLayout';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import VerifyOtp from './Pages/Product/OTPPAGE/VERIFYOTP';

// Seller Pages
import SellerLayout from './Pages/Seller/SellerLayout';
import SellerDashboard from './Pages/Seller/SellerDashboard';
import SellerOrders from './Pages/Seller/SellerOrders';
import SellerAnalytics from './Pages/Seller/SellerAnalytics';
import SellerPayouts from './Pages/Seller/SellerPayouts';
import SellerMessages from './Pages/Seller/SellerMessage';
import SellerSettings from './Pages/Seller/SellerSetting';
import SellerProducts from './Pages/Seller/SellerProduct';
import SellersCustomers from './Pages/Seller/SellerCustomers';
import BuyerMessages from './Pages/Buyer/BuyerMessage';




function App() {
  const { isLogin, user, authReady } = useContext(AppContext);
  const location = useLocation();

  const requireLogin = (element) => (
    !authReady ? null : isLogin ? (
      element
    ) : (
      <Navigate
        to="/authpage?mode=login"
        replace
        state={{
          redirectTo: `${location.pathname}${location.search}`,
          mode: "login",
        }}
      />
    )
  );

  return (
    <Routes>
   
      <Route path="/authpage" element={<AuthPage />} />
      <Route path="/login" element={<Navigate to="/authpage?mode=login" replace />} />
      <Route path="/register" element={<Navigate to="/authpage?mode=register" replace />} />
      <Route path="/forgot-password" element={<RequestPasswordReset />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/checkout/verify" element={<PaymentCallbackPage />} />
      
   
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="product/:id" element={requireLogin(<ProductDetailPage />)} />
        <Route path="shoppage" element={<ShopPage />} />
        <Route
          path="messages"
          element={
            !authReady
              ? null
              : isLogin
                ? <BuyerMessages />
                : <Navigate to="/authpage?mode=login" replace state={{ redirectTo: "/messages", mode: "login" }} />
          }
        />
      </Route>

   
      <Route path="/" element={<Layout />}>
        <Route 
          path="cart" 
          element={
            !authReady
              ? null
              : isLogin
                ? <CartPage />
                : <Navigate to="/authpage?mode=login" replace state={{ redirectTo: "/cart", mode: "login" }} />
          }
        />
        <Route 
          path="checkout" 
          element={
            !authReady
              ? null
              : isLogin
                ? <CheckoutPage />
                : <Navigate to="/authpage?mode=login" replace state={{ redirectTo: "/checkout", mode: "login" }} />
          }
        />
        <Route 
          path="orderpage" 
          element={
            !authReady
              ? null
              : isLogin
                ? <OrderPage />
                : <Navigate to="/authpage?mode=login" replace state={{ redirectTo: "/orderpage", mode: "login" }} />
          }
        />
        <Route path="track-order/:orderId" element={<TrackOrderPage />} />
        <Route 
          path="dispute/:orderId" 
          element={
            !authReady
              ? null
              : isLogin
                ? <DisputePage />
                : <Navigate to="/authpage?mode=login" replace state={{ mode: "login" }} />
          }
        />
      </Route>

    
<Route 
  path="/seller/*" 
   element={
    !authReady
      ? null
      : isLogin && user?.roles?.includes("seller")
      ? <SellerLayout /> 
      : <Navigate to="/" replace />
  }
>
  <Route index element={<SellerDashboard />} />
  <Route path="products" element={<SellerProducts />} />
  <Route path="orders" element={<SellerOrders />} />
  <Route path="analytics" element={<SellerAnalytics />} />
  <Route path="messages" element={<SellerMessages />} />
  <Route path="payouts" element={<SellerPayouts/>} />
  <Route path="customers" element={<SellersCustomers />} />
  <Route path="settings" element={<SellerSettings />} />
</Route>

<Route
  path="/admin/*"
  element={
    !authReady
      ? null
      : isLogin && user?.roles?.includes("admin")
      ? <AdminLayout />
      : <Navigate to="/authpage?mode=login&role=admin" replace state={{ mode: "login" }} />
  }
>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<AdminDashboard />} />
</Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
