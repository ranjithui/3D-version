import { lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CakePage = lazy(() => import('./pages/CakePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CustomCakesPage = lazy(() => import('./pages/CustomCakesPage'));
const GiftingPage = lazy(() => import('./pages/GiftingPage'));
const HampersPage = lazy(() => import('./pages/HampersPage'));
const AddOnsPage = lazy(() => import('./pages/AddOnsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const StoresPage = lazy(() => import('./pages/StoresPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const CorporatePage = lazy(() => import('./pages/CorporatePage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const TITLES = {
  '/': 'Desert Forest — Cakes, Desserts and Celebrations in Coimbatore',
  '/products': 'Our Menu — Cakes, Pastries and Bakes',
};

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (TITLES[pathname]) document.title = TITLES[pathname];
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <TitleSync />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<MenuPage />} />
          <Route path="cakes/:slug" element={<CakePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="custom-cakes" element={<CustomCakesPage />} />
          <Route path="gifting" element={<GiftingPage />} />
          <Route path="gifting/:slug" element={<HampersPage />} />
          <Route path="add-ons" element={<AddOnsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="queries" element={<ContactPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="corporate-orders" element={<CorporatePage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="privacy-policy" element={<PolicyPage slug="privacy-policy" />} />
          <Route path="terms-and-conditions" element={<PolicyPage slug="terms-and-conditions" />} />
          <Route path="cancellation-and-refund-policy" element={<PolicyPage slug="cancellation-and-refund-policy" />} />
          <Route path=":category" element={<CategoryPage />} />
          <Route path=":category/:sub" element={<CategoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
