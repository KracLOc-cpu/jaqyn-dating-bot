import { Route, Routes, useNavigate } from "react-router-dom";

import { Button } from "./components/Button";
import { Splash } from "./components/Splash";
import { ToastHost } from "./components/ui/Toast";
import Entry from "./pages/Entry";
import Welcome from "./pages/Welcome";
import Dev from "./pages/Dev";
import Username from "./pages/Username";
import Moderation from "./pages/Moderation";
import Name from "./pages/onboarding/Name";
import Gender from "./pages/onboarding/Gender";
import LookingFor from "./pages/onboarding/LookingFor";
import Age from "./pages/onboarding/Age";
import City from "./pages/onboarding/City";
import Culture from "./pages/onboarding/Culture";
import Show from "./pages/onboarding/Show";
import Languages from "./pages/onboarding/Languages";
import Intention from "./pages/onboarding/Intention";
import Bio from "./pages/onboarding/Bio";
import Photos from "./pages/onboarding/Photos";
import Feed from "./pages/Feed";
import Detail from "./pages/Detail";
import Match from "./pages/Match";
import Matches from "./pages/Matches";
import Filters from "./pages/Filters";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";

function Placeholder() {
  const navigate = useNavigate();
  return (
    <div className="app-h mx-auto flex max-w-md flex-col items-center justify-center px-8 text-center safe-t safe-b">
      <h1 className="text-[22px] font-bold text-ink">Страница не найдена</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Такой экран не подключён. Вернись в ленту и продолжи поиск.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <Button onClick={() => navigate("/feed")}>В ленту</Button>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Entry />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/dev" element={<Dev />} />
        <Route path="/username" element={<Username />} />

        {/* Онбординг (экраны 3–13) */}
        <Route path="/onboarding/name" element={<Name />} />
        <Route path="/onboarding/gender" element={<Gender />} />
        <Route path="/onboarding/looking-for" element={<LookingFor />} />
        <Route path="/onboarding/age" element={<Age />} />
        <Route path="/onboarding/city" element={<City />} />
        <Route path="/onboarding/culture" element={<Culture />} />
        <Route path="/onboarding/show" element={<Show />} />
        <Route path="/onboarding/languages" element={<Languages />} />
        <Route path="/onboarding/intention" element={<Intention />} />
        <Route path="/onboarding/bio" element={<Bio />} />
        <Route path="/onboarding/photos" element={<Photos />} />
        <Route path="/moderation" element={<Moderation />} />

        {/* F2: вау-ядро */}
        <Route path="/feed" element={<Feed />} />
        <Route path="/card" element={<Detail />} />
        <Route path="/match" element={<Match />} />
        <Route path="/matches" element={<Matches />} />

        {/* F3: фильтры, профиль */}
        <Route path="/filters" element={<Filters />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
  );
}

export default function App() {
  return (
    <>
      <AnimatedRoutes />
      <ToastHost />
      <Splash />
    </>
  );
}
