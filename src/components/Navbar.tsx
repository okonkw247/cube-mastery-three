import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import jsnLogo from "@/assets/jsn-logo.png";

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
            <img 
              src={jsnLogo} 
              alt="JSN Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0 relative z-10" 
            />
            <span className="text-base sm:text-xl font-bold text-foreground hidden xs:inline">JSN Cubing</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isLanding && (
              <>
                <a href="#problem" className="text-muted-foreground hover:text-foreground transition-colors">
                  Why Us
                </a>
                <a href="#offers" className="text-muted-foreground hover:text-foreground transition-colors">
                  What We Offer
                </a>
                <a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors">
                  Method
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default">Start Free</Button>
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
                    Why Us
                  </a>
                  <a href="#offers" className="text-muted-foreground hover:text-foreground transition-colors">
                    What We Offer
                  </a>
                  <a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors">
                    Method
                  </a>
                  <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </>
              )}
              <div className="flex flex-col gap-2 mt-4">
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost" className="w-full">Dashboard</Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" className="w-full">Profile</Button>
                    </Link>
                    <Link to="/settings">
                      <Button variant="ghost" className="w-full gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" className="w-full">Log In</Button>
                    </Link>
                    <Link to="/auth?mode=signup">
                      <Button variant="default" className="w-full">Start Free</Button>
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