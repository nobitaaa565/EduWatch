import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from '../components/PublicNav';
import { Footer } from '../components/Footer';
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Send, Users, Heart, UserPlus, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { feed } from '../lib/feedData';
import { mockData, SlideshowSection } from '../data/mockData';

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [homeData, setHomeData] = React.useState(mockData);

  const [newTitle, setNewTitle] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');

  const slideshowSection = homeData.find(s => s.type === 'slideshow') as SlideshowSection | undefined;
  const slides = slideshowSection ? slideshowSection.slides : [];

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  React.useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleToggleLike = (cardIndex: number) => {
    setHomeData((prev) =>
      prev.map((section) => {
        if (section.type === 'curation') {
          const updatedCards = section.cards.map((c, idx) => {
            if (idx === cardIndex) {
              const currentlyLiked = c.isLiked || false;
              return {
                ...c,
                isLiked: !currentlyLiked,
                likes: (c.likes ?? 0) + (currentlyLiked ? -1 : 1),
              };
            }
            return c;
          });
          return { ...section, cards: updatedCards };
        }
        return section;
      })
    );
  };

  const handleToggleFollow = (cardIndex: number) => {
    setHomeData((prev) =>
      prev.map((section) => {
        if (section.type === 'curation') {
          const updatedCards = section.cards.map((c, idx) => {
            if (idx === cardIndex) {
              return {
                ...c,
                isFollowing: !(c.isFollowing || false),
              };
            }
            return c;
          });
          return { ...section, cards: updatedCards };
        }
        return section;
      })
    );
  };

  const handleAddCard = (formTitle: string, formDescription: string) => {
    setHomeData((prev) =>
      prev.map((section) => {
        if (section.type === 'curation') {
          const newCard = {
            cardType: 'medium' as const,
            postId: Date.now().toString(),
            title: formTitle,
            description: formDescription,
            image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
            likes: 0,
            isLiked: false,
            isFollowing: false,
          };
          const updatedCards = [...section.cards];
          // Insert inside section.cards, before the last card (the small_cta)
          const ctaIndex = updatedCards.findIndex((c) => c.cardType === 'small_cta');
          if (ctaIndex !== -1) {
            updatedCards.splice(ctaIndex, 0, newCard);
          } else {
            updatedCards.push(newCard);
          }
          return {
            ...section,
            cards: updatedCards,
          };
        }
        return section;
      })
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <PublicNav />
      
      <main className="pt-[95px] pb-10 px-4 sm:px-8 lg:px-10 max-w-7xl mx-auto">
        {homeData.map((section, idx) => {
          switch (section.type) {
            case 'hero':
              return (
                <section key={idx} className="mb-20 pt-6 sm:pt-12 text-center" id="hero-section">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-on-surface leading-tight tracking-[-0.06em] mb-4 sm:mb-6 font-manrope">
                      {section.title.line1} <br />
                      <span className="text-primary">{section.title.line2}</span>
                    </h1>
                    <p className="text-secondary text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed">
                      {section.description}
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 mb-12 sm:mb-16">
                      {section.buttons.map((btn, btnIdx) => (
                        <button 
                          key={btnIdx}
                          onClick={() => navigate(btn.path)}
                          className={cn(
                            "w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 rounded-md font-bold text-base sm:text-lg transition-all active:scale-95",
                            btn.variant === 'primary' 
                              ? "bg-on-surface text-surface hover:bg-primary transition-all shadow-xl shadow-on-surface/10" 
                              : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all border border-outline-variant/20"
                          )}
                        >
                          {btn.text}
                        </button>
                      ))}
                    </div>
                    
                    {/* Joining Indicators */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xs font-bold shadow-lg">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-secondary uppercase tracking-widest">
                        {section.indicator}
                      </p>
                    </div>
                  </motion.div>
                </section>
              );

            case 'slideshow':
              if (slides.length === 0) return null;
              return (
                <section key={idx} className="mb-16 md:mb-24" id="slideshow-section">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <h2 className="text-xs font-bold text-primary uppercase tracking-[0.3em]">{section.sectionLabel}</h2>
                    <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
                  </div>
                  
                  <div className="relative h-[380px] sm:h-[480px] md:h-[500px] rounded-2xl sm:rounded-[40px] overflow-hidden ambient-shadow group">
                    <motion.div 
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <img 
                        src={slides[currentSlide].image} 
                        alt={slides[currentSlide].title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/40 to-transparent"></div>
                    </motion.div>

                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-20">
                      <motion.div
                        key={`content-${currentSlide}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="max-w-2xl"
                      >
                        <span className="inline-block bg-primary/5 backdrop-blur-md border border-primary/30 text-white px-4 py-1 rounded text-[10px] font-bold uppercase tracking-[0.2em] mb-4 sm:mb-6">
                          {slides[currentSlide].tag}
                        </span>
                        <h2 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-6 font-manrope leading-tight tracking-tighter">
                          {slides[currentSlide].title}
                        </h2>
                        <p className="text-white/70 text-xs sm:text-base md:text-lg lg:text-xl leading-relaxed mb-6 sm:mb-10 line-clamp-2 sm:line-clamp-none">
                          {slides[currentSlide].description}
                        </p>
                        <button 
                          onClick={() => navigate(`/article/${currentSlide + 1}`)}
                          className="bg-white text-on-surface px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                        >
                          Read Insight
                        </button>
                      </motion.div>

                      {/* Slide Indicators */}
                      <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 flex gap-2 sm:gap-3">
                        {slides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={cn(
                              "h-1.5 transition-all duration-500 rounded-full",
                              currentSlide === i ? "w-8 sm:w-12 bg-primary" : "w-2.5 sm:w-3 bg-white/30 hover:bg-white/50"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );

            case 'curation':
              return (
                <section key={idx} className="" id="curation-section">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tighter mb-2 font-manrope">{section.title}</h2>
                      <p className="text-secondary text-sm sm:text-base">{section.description}</p>
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                      <button 
                        onClick={prevSlide}
                        className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-secondary hover:bg-surface-container transition-colors active:scale-90"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={nextSlide}
                        className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-secondary hover:bg-surface-container transition-colors active:scale-90"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 md:gap-8">
                    {section.cards.map((card, cIndex) => {
                      if (card.cardType === 'large') {
                        return (
                          <article 
                            key={cIndex}
                            onClick={() => navigate(`/article/${card.postId}`)}
                            className="md:col-span-2 md:row-span-2 bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow flex flex-col group cursor-pointer border border-outline-variant/10 hover:border-primary/20 transition-all duration-300"
                          >
                            <div className="h-48 sm:h-64 md:h-80 overflow-hidden relative">
                              <img 
                                alt={card.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                src={card.image} 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-5 sm:p-8 md:p-10 flex flex-col flex-grow">
                              <h3 className="text-xl sm:text-2xl font-bold text-on-surface mb-3 md:mb-4 leading-tight font-manrope group-hover:text-primary transition-colors">{card.title}</h3>
                              <p className="text-secondary mb-6 md:mb-8 leading-relaxed line-clamp-3 text-sm sm:text-base">{card.description}</p>
                              <div className="mt-auto flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden">
                                    <img src={card.authorImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.author || '')}&background=random`} alt={card.author} referrerPolicy="no-referrer" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-on-surface">{card.author}</p>
                                      {card.author && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFollow(cIndex);
                                          }}
                                          className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                                            card.isFollowing 
                                              ? "bg-primary text-white" 
                                              : "bg-surface-container hover:bg-outline-variant/10 text-secondary border border-outline-variant/10"
                                          )}
                                        >
                                          {card.isFollowing ? <UserCheck className="w-2.5 h-2.5" /> : <UserPlus className="w-2.5 h-2.5" />}
                                          {card.isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-secondary">{card.role || 'Technical Contributor'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {card.likes !== undefined && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleLike(cIndex);
                                      }}
                                      className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-sm font-bold",
                                        card.isLiked ? "text-primary bg-primary/10" : "text-secondary"
                                      )}
                                    >
                                      <Heart className={cn("w-4 h-4 transition-transform active:scale-125", card.isLiked && "fill-primary text-primary")} />
                                      {card.likes}
                                    </button>
                                  )}
                                  <span className="text-xs font-medium text-secondary">{card.date}</span>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      }

                      if (card.cardType === 'medium') {
                        return (
                          <article 
                            key={cIndex}
                            onClick={() => navigate(`/article/${card.postId}`)}
                            className="md:col-span-2 bg-surface-container-low rounded-xl overflow-hidden flex flex-col sm:flex-row group cursor-pointer border border-outline-variant/10 hover:border-primary/20 transition-all duration-300"
                          >
                            <div className="w-full sm:w-1/3 h-48 sm:h-auto overflow-hidden">
                              <img 
                                alt={card.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                src={card.image} 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="w-full sm:w-2/3 p-5 sm:p-8 flex flex-col justify-between">
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-2 sm:mb-3 font-manrope leading-tight group-hover:text-primary transition-colors line-clamp-2">{card.title}</h3>
                                <p className="text-xs sm:text-sm text-secondary line-clamp-2 mb-4">{card.description}</p>
                              </div>
                              {card.likes !== undefined && (
                                <div className="flex justify-end mt-2 sm:mt-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleLike(cIndex);
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1 bg-surface-container hover:bg-outline-variant/15 rounded-full transition-all text-xs font-bold",
                                      card.isLiked ? "text-primary bg-primary/10" : "text-secondary"
                                    )}
                                  >
                                    <Heart className={cn("w-3.5 h-3.5 transition-transform active:scale-125", card.isLiked && "fill-primary text-primary")} />
                                    {card.likes}
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      }

                      if (card.cardType === 'small_link') {
                        return (
                          <article 
                            key={cIndex}
                            onClick={() => navigate(`/article/${card.postId}`)}
                            className="md:col-span-1 bg-surface-container-lowest rounded-xl overflow-hidden p-6 sm:p-8 ambient-shadow border border-outline-variant/5 hover:border-primary/20 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
                          >
                            <div>
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                                <span className="text-primary font-bold">{card.number}</span>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-on-surface mb-3 font-manrope group-hover:text-primary transition-colors line-clamp-2">{card.title}</h3>
                              <p className="text-xs sm:text-sm text-secondary mb-6 line-clamp-2">{card.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/10">
                              <div className="text-primary font-bold text-sm flex items-center gap-1 group/btn">
                                {card.btnText}
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                              </div>
                              {card.likes !== undefined && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleLike(cIndex);
                                  }}
                                  className={cn(
                                    "flex items-center gap-1 px-2.5 py-1 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-[11px] font-bold",
                                    card.isLiked ? "text-primary bg-primary/15" : "text-secondary"
                                  )}
                                >
                                  <Heart className={cn("w-3 h-3 transition-transform active:scale-125", card.isLiked && "fill-primary text-primary")} />
                                  {card.likes}
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      }

                      if (card.cardType === 'small_cta') {
                        return (
                          <article key={cIndex} className="md:col-span-1 bg-on-surface text-surface rounded-xl overflow-hidden p-6 flex flex-col justify-between shadow-2xl shadow-on-surface/20">
                            <div>
                              <h3 className="text-lg font-bold mb-1 font-manrope">{card.title}</h3>
                              <p className="text-xs text-surface/70 mb-4">{card.description}</p>
                              
                              {/* Integrated Interactive Propose Form */}
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!newTitle.trim()) return;
                                  handleAddCard(newTitle, newDescription);
                                  setNewTitle('');
                                  setNewDescription('');
                                }}
                                className="space-y-2.5 mt-3 pt-3 border-t border-surface/10"
                              >
                                <input 
                                  type="text"
                                  placeholder="Insight Title..."
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-surface/10 placeholder-surface/40 text-surface text-xs rounded border border-surface/10 focus:outline-none focus:border-primary transition-colors"
                                  required
                                />
                                <textarea 
                                  placeholder="Insight Description..."
                                  value={newDescription}
                                  onChange={(e) => setNewDescription(e.target.value)}
                                  className="w-full h-14 px-3 py-1.5 bg-surface/10 placeholder-surface/40 text-surface text-xs rounded border border-surface/10 focus:outline-none focus:border-primary transition-colors resize-none"
                                />
                                <button 
                                  type="submit"
                                  className="w-full bg-primary text-white rounded-md py-2 text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                  <Send className="w-3 h-3" />
                                  {card.btnText}
                                </button>
                              </form>
                            </div>
                          </article>
                        );
                      }

                      return null;
                    })}
                  </div>
                </section>
              );

            case 'stats_banner':
              return (
                <section key={idx} className="mt-16 md:mt-32" id="stats-banner-section">
                  <div className="relative rounded-3xl md:rounded-[40px] overflow-hidden bg-gradient-to-br from-[#001a4d] via-[#001a4d] to-[#002b80] py-12 px-6 sm:py-20 sm:px-12 md:py-24 md:px-24">
                    <div className="absolute inset-0 opacity-30 pointer-events-none">
                      <div className="absolute top-[-50%] left-[-10%] w-full h-[200%] bg-[radial-gradient(circle,rgba(29,97,255,0.3)_0%,transparent_70%)]"></div>
                    </div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                      <div className="lg:col-span-7">
                        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 sm:mb-8 font-manrope leading-[1.1]">
                          {section.title.line1} <br />
                          {section.title.line2}
                        </h2>
                        <p className="text-white/70 text-sm sm:text-lg md:text-xl leading-relaxed mb-6 sm:mb-12 max-w-xl">
                          {section.description}
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                          {section.buttons.map((btn, btnIdx) => (
                            <button 
                              key={btnIdx}
                              onClick={() => btn.path && navigate(btn.path)}
                              className={cn(
                                "w-full sm:w-auto px-6 py-3 md:px-10 md:py-4 rounded-xl font-bold text-sm sm:text-base text-center transition-all active:scale-95",
                                btn.variant === 'primary' 
                                  ? "bg-[#1d61ff] text-white hover:brightness-110 shadow-xl shadow-[#1d61ff]/20" 
                                  : "bg-[#1a2b5a]/50 backdrop-blur-sm text-white border border-white/10 hover:bg-[#1a2b5a]/80"
                              )}
                            >
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
                        {section.stats.map((stat) => (
                          <div key={stat.label} className="bg-white/5 backdrop-blur-md rounded-[24px] p-4 sm:p-6 md:p-8 border border-white/10 flex flex-col justify-center">
                            <h4 className="text-2xl sm:text-4xl font-bold text-white mb-2 font-manrope tracking-tight">{stat.value}</h4>
                            <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
      </main>

      <Footer />
    </div>
  );
}

