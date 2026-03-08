import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <LogoWithGlow size="md" />
            <span className="text-base sm:text-xl font-bold text-foreground hidden xs:inline">JSN Cubing</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isLanding && (
              <>
                <a href="#problem" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.whyUs')}
                </a>
                <a href="#offers" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.whatWeOffer')}
                </a>
                <a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.method')}
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.pricing')}
                </a>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector compact />
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">{t('nav.dashboard')}</Button>
                </Link>
                <Link to="/community">
                  <Button variant="ghost">Community</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="ghost">Leaderboard</Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost">{t('common.profile')}</Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  {t('common.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">{t('nav.logIn')}</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default">{t('nav.startFree')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-in">
              <div className="flex flex-col gap-4">
                {isLanding && (
                  <>
                    <a href="#problem" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t('nav.whyUs')}
                    </a>
                    <a href="#offers" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t('nav.whatWeOffer')}
                    </a>
                    <a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t('nav.method')}
                    </a>
                    <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t('nav.pricing')}
                    </a>
                  </>
                )}
                <div className="flex flex-col gap-2 mt-4">
                  {user ? (
                    <>
                      <Link to="/dashboard">
                        <Button variant="ghost" className="w-full">{t('nav.dashboard')}</Button>
                      </Link>
                      <Link to="/profile">
                        <Button variant="ghost" className="w-full">{t('common.profile')}</Button>
                      </Link>
                      <Link to="/settings">
                        <Button variant="ghost" className="w-full gap-2">
                          <Settings className="w-4 h-4" />
                          {t('common.settings')}
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
                        <LogOut className="w-4 h-4" />
                        {t('common.signOut')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth">
                        <Button variant="ghost" className="w-full">{t('nav.logIn')}</Button>
                      </Link>
                      <Link to="/auth?mode=signup">
                        <Button variant="default" className="w-full">{t('nav.startFree')}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </nav>
  );
};

export default Navbar;