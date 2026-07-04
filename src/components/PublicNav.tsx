import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

export function PublicNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-[20px] shadow-[0_20px_40px_rgba(25,27,36,0.06)] border-b border-outline-variant/10">
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-10 py-4 max-w-[1380px] mx-auto">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu on Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="text-2xl font-black tracking-tighter text-on-surface rounded-sm">
            EduWatch
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8 font-manrope font-bold tracking-tight">
          <Link to="/articles" className="text-on-surface border-b-2 border-primary pb-1 transition-all rounded-sm">Articles</Link>
          <Link to="/resources" className="text-on-surface hover:text-primary transition-colors duration-300 rounded-sm">Resources</Link>
          <Link to="/tutorials" className="text-on-surface hover:text-primary transition-colors duration-300 rounded-sm">Tutorials</Link>
          <Link to="/about" className="text-on-surface hover:text-primary transition-colors duration-300 rounded-sm">About</Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={toggleTheme}
            className="text-on-surface hover:text-primary transition-colors p-1 rounded-sm"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          
          <button className="text-on-surface hover:text-primary transition-colors p-1 rounded-sm hidden sm:inline-block">
            <Search className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-3">
            <Link 
              to="/signin"
              className="text-on-surface hover:text-primary font-semibold transition-colors text-sm"
            >
              Sign In
            </Link>
            <Link 
              to="/signup"
              className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2 rounded-md font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Sign Up
            </Link>
          </div>

          {/* Fallback Sign In for ultra compact views */}
          <Link 
            to="/signin" 
            className="sm:hidden text-xs bg-surface-container-high text-on-surface px-3 py-1.5 rounded-md font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Slide-out Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-[65px] bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-[65px] bottom-0 w-[270px] bg-surface-container-lowest border-r border-[#1d61ff]/10 z-50 p-6 flex flex-col md:hidden overflow-y-auto"
            >
              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1d61ff]/80 font-mono">Explore Categories</h3>
                  <div className="flex flex-col gap-3 font-manrope font-bold text-sm">
                    <Link 
                      to="/articles" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-on-surface hover:text-primary p-2 rounded-lg hover:bg-surface-container transition-all"
                    >
                      Articles
                    </Link>
                    <Link 
                      to="/resources" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-on-surface hover:text-primary p-2 rounded-lg hover:bg-surface-container transition-all"
                    >
                      Resources
                    </Link>
                    <Link 
                      to="/tutorials" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-on-surface hover:text-primary p-2 rounded-lg hover:bg-surface-container transition-all"
                    >
                      Tutorials
                    </Link>
                    <Link 
                      to="/about" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-on-surface hover:text-primary p-2 rounded-lg hover:bg-surface-container transition-all"
                    >
                      About
                    </Link>
                  </div>
                </div>

                <div className="h-px bg-outline-variant/15" />

                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary/70 font-mono">Membership</h3>
                  <div className="flex flex-col gap-3">
                    <Link 
                      to="/signin" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-sm font-bold transition-all"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/signup" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg bg-gradient-to-br from-[#1d61ff] to-primary-container text-white hover:brightness-110 text-sm font-bold transition-all shadow-md shadow-primary/10"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10 text-center">
                <p className="text-[10px] text-secondary font-semibold font-mono">© 2026 EduWatch</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
