'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Menu, User as UserIcon, LogOut } from 'lucide-react';
import { auth } from '@/firebase/config'; // Adjust the import path as needed
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const desktopProfileMenuRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = desktopProfileMenuRef.current && !desktopProfileMenuRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(event.target as Node);

      if ((isOutsideDesktop || !desktopProfileMenuRef.current) && (isOutsideMobile || !mobileProfileMenuRef.current)) {
          setIsProfileMenuOpen(false);
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
    <nav className="fixed top-0 left-0 right-0 z-50 text-slate-800 shadow-sm backdrop-blur-lg bg-white border-b border-slate-200 py-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <img src="/logo.png" alt="Logo" className='rounded-md' />
            </div>
            <span className="font-bold text-xl text-slate-900">
              Contextual AI
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {currentUser ? (
              <div className="relative" ref={desktopProfileMenuRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="focus:outline-none"
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User Profile" className="w-10 h-10 rounded-full border-2 border-slate-300 hover:border-blue-500 transition" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300 hover:border-blue-500 transition">
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
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
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200 rounded-md hover:bg-slate-100"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/signup')}
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
             {currentUser ? (
               <div className="relative" ref={mobileProfileMenuRef}>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="focus:outline-none"
                  >
                      {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="User Profile" className="w-9 h-9 rounded-full border-2 border-slate-300" />
                      ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300">
                              <UserIcon className="w-5 h-5 text-slate-500" />
                          </div>
                      )}
                  </button>
                  {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                          <button 
                            onClick={handleLogout} 
                            className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
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
                    className="text-slate-600 hover:text-slate-900 focus:outline-none p-2"
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
                className="block w-full text-left px-4 py-3 text-base text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors duration-200"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigation('/signup')}
                className="block w-full text-left px-4 py-3 text-base font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
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