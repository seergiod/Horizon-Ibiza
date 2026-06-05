import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "@/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PersistentReserveBar } from "@/components/PersistentReserveBar";
import { Home } from "@/pages/Home";
import { Menu } from "@/pages/Menu";
import { Reserve } from "@/pages/Reserve";
import { Contact } from "@/pages/Contact";
import { Sunset } from "@/pages/Sunset";
import { SeaView } from "@/pages/SeaView";
import { Romantic } from "@/pages/Romantic";
import { NotFound } from "@/pages/NotFound";

function AppShell() {
  return (
    <>
      <SiteHeader />
      <main>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sunset-dinner-ibiza" element={<Sunset />} />
            <Route path="/sea-view-restaurant-ibiza" element={<SeaView />} />
            <Route path="/romantic-restaurant-ibiza" element={<Romantic />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <PersistentReserveBar />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppShell />
    </BrowserRouter>
  );
}
