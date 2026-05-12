import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <LogoWithGlow size="md" />
            <span className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
              JSN Cubing
            </span>
          </Link>

          {/* Desktop public nav */}
          {!user && isLanding && (
            <div className="hidden md:flex items-center gap-10">
              <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.whyUs')}
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.pricing')}
              </a>
            </div>
          )}

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="px-4">{t('nav.dashboard')}</Button>
                </Link>
                <Link to="/community">
                  <Button variant="ghost" className="px-4">{t('nav.community')}</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="ghost" className="px-4">{t('nav.leaderboard')}</Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full ml-2"
                      aria-label="Profile menu"
                    >
                      <UserIcon className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <UserIcon className="w-4 h-4 mr-2" />
                        {t('common.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('common.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('common.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="px-4">{t('nav.logIn')}</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default" className="px-5">{t('nav.startFree')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {!user && isLanding && (
                <>
                  <a href="#problem" className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('nav.whyUs')}
                  </a>
                  <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('nav.pricing')}
                  </a>
                </>
              )}
              <div className="flex flex-col gap-2 mt-2">
                {user ? (
                  <>
                    <Link to="/dashboard"><Button variant="ghost" className="w-full justify-start">{t('nav.dashboard')}</Button></Link>
                    <Link to="/community"><Button variant="ghost" className="w-full justify-start">{t('nav.community')}</Button></Link>
                    <Link to="/leaderboard"><Button variant="ghost" className="w-full justify-start">{t('nav.leaderboard')}</Button></Link>
                    <Link to="/profile"><Button variant="ghost" className="w-full justify-start">{t('common.profile')}</Button></Link>
                    <Link to="/settings"><Button variant="ghost" className="w-full justify-start gap-2"><Settings className="w-4 h-4" />{t('common.settings')}</Button></Link>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
                      <LogOut className="w-4 h-4" />
                      {t('common.signOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth"><Button variant="ghost" className="w-full">{t('nav.logIn')}</Button></Link>
                    <Link to="/auth?mode=signup"><Button variant="default" className="w-full">{t('nav.startFree')}</Button></Link>
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
