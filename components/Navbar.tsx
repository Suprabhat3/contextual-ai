'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Menu, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { auth } from '@/firebase/config'; // Adjust the import path as needed
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // 1. Create two separate refs
  const desktopProfileMenuRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 2. Update useEffect to handle clicks outside both menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the desktop menu
      const isOutsideDesktop = desktopProfileMenuRef.current && !desktopProfileMenuRef.current.contains(event.target as Node);
      // Check if the click is outside the mobile menu
      const isOutsideMobile = mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(event.target as Node);

      // If the desktop menu exists and the click is outside...
      if (isOutsideDesktop) {
          // ...and if the mobile menu also exists and the click is outside (or if it doesn't exist), close the menu.
          if (isOutsideMobile || !mobileProfileMenuRef.current) {
               setIsProfileMenuOpen(false);
          }
      // Or, if the mobile menu exists and the click is outside...
      } else if (isOutsideMobile) {
          // ...and if the desktop menu also exists and the click is outside (or if it doesn't exist), close the menu.
          if (isOutsideDesktop || !desktopProfileMenuRef.current) {
              setIsProfileMenuOpen(false);
          }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = (path: string) => {
    window.location.href = path;
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileMenuOpen(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 text-white shadow-md backdrop-blur-lg bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Logo" className='rounded-md' />
            </div>
            <span className="font-bold text-xl text-slate-100">
              ContextualAI
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {currentUser ? (
              // 3. Assign the desktop ref here
              <div className="relative" ref={desktopProfileMenuRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="focus:outline-none"
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User Profile" className="w-9 h-9 rounded-full border-2 border-slate-600 hover:border-blue-400 transition" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 hover:border-blue-400 transition">
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={() => {
                        handleNavigation('/profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors duration-200 rounded-md hover:bg-slate-800"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/signup')}
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transform hover:scale-105 transition-all duration-200 shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
             {currentUser ? (
                // 4. Assign the mobile ref here
               <div className="relative" ref={mobileProfileMenuRef}>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="focus:outline-none"
                  >
                      {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="User Profile" className="w-9 h-9 rounded-full border-2 border-slate-600" />
                      ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                              <UserIcon className="w-5 h-5 text-slate-400" />
                          </div>
                      )}
                  </button>
                   {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-50">
                          <button 
                            onClick={() => {
                              handleNavigation('/profile');
                              setIsProfileMenuOpen(false);
                            }} 
                            className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Profile
                          </button>
                          <button 
                            onClick={handleLogout} 
                            className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                      </div>
                  )}
                </div>
            ) : (
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-slate-300 hover:text-white focus:outline-none p-2"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && !currentUser && (
          <div className="md:hidden pb-4">
            <div className="pt-2 pb-3 space-y-2">
              <button
                onClick={() => handleNavigation('/login')}
                className="block w-full text-left px-4 py-3 text-base text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors duration-200"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigation('/signup')}
                className="block w-full text-left px-4 py-3 text-base font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors duration-200"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;