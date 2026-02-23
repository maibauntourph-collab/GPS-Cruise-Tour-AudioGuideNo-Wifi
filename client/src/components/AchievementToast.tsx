import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, MapPin } from 'lucide-react';
import { Landmark } from '@shared/schema';

interface AchievementToastProps {
    landmark: Landmark;
    language: string;
    onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ landmark, language, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500); // Wait for exit animation
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const name = landmark.translations?.[language]?.name || landmark.translations?.['en']?.name || landmark.name;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm"
                >
                    <div className="relative overflow-hidden rounded-2xl glass-premium aurora-border-premium p-4 shadow-2xl">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10" />
                        <div className="absolute top-0 right-0 p-1 opacity-20">
                            <Sparkles className="w-8 h-8 text-amber-400" />
                        </div>

                        <div className="relative flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider px-1.5 h-4 border-none">
                                        New Achievement
                                    </Badge>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3].map(i => (
                                            <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                    {language === 'ko' ? '배지 획득!' : 'Badge Earned!'}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{name}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 h-1 bg-amber-500/50 w-full overflow-hidden">
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                                className="h-full bg-amber-500"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Helper components if needed or imports from UI
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default AchievementToast;
