import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Check, Heart, ExternalLink, Crown, Sparkles } from 'lucide-react';

// Stripe Payment Links (test mode)
const STRIPE_LINKS = {
  dayPass: 'https://buy.stripe.com/test_3cI6oIa9L3i46RB83F7bW00',
  monthly: 'https://buy.stripe.com/test_6oU6oI3Ln9Gsfo72Jl7bW01',
  annual: 'https://buy.stripe.com/test_14A8wQ2Hj3i4fo72Jl7bW02',
};

interface SubscriptionPlanProps {
    onBack: () => void;
    selectedLanguage: string;
}

export function SubscriptionPlan({ onBack, selectedLanguage }: SubscriptionPlanProps) {
    const isKo = selectedLanguage === 'ko';

    return (
        <div className="bg-white min-h-full pb-8">
            {/* Header */}
            <div className="flex items-center px-4 py-4 border-b border-slate-100">
                <button className="pr-4 active:scale-95 transition-transform" onClick={onBack}>
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </button>
                <h1 className="text-lg font-bold text-slate-800">
                    {isKo ? '구독 플랜 선택' : 'Select Subscription Plan'}
                </h1>
            </div>

            <div className="p-4 space-y-4 max-w-lg mx-auto">
                {/* $1.99 Day Pass Card */}
                <div
                    className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => window.open(STRIPE_LINKS.dayPass, '_blank')}
                >
                    <Heart className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="text-sm font-bold text-slate-800">
                            {isKo ? '오늘 하루만 필요하다면?' : 'Need it just for today?'}
                        </div>
                        <div className="text-sm font-black text-orange-600 mb-0.5">
                            {isKo ? '1회 기항지 패스 $1.99' : '1-Port Pass $1.99'}
                        </div>
                        <div className="text-xs font-semibold text-orange-600/70">
                            {isKo ? '구독 없이 1개 도시만 잠금 해제' : 'Unlock 1 city without subscription'}
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-orange-400 shrink-0 mt-1" />
                </div>

                {/* FREE Plan Card */}
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">
                                {isKo ? '무료' : 'FREE'}
                            </h2>
                            <span className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">Free</span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-slate-800">
                                $0 <span className="text-sm font-bold text-slate-400">/{isKo ? '영구' : 'forever'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm font-bold text-slate-700">{isKo ? '1개 도시 (시범)' : '1 City (Trial)'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm font-bold text-slate-700">{isKo ? '랜드마크 최대 5개' : 'Max 5 Landmarks'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm font-bold text-slate-700">{isKo ? 'GPS 자동재생 + 오프라인' : 'GPS Auto-play + Offline'}</span>
                        </div>
                        <div className="flex items-start gap-2 opacity-40">
                            <div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 line-through">{isKo ? '전체 도시 / 중국어 오디오' : 'All Cities / Chinese Audio'}</span>
                        </div>
                    </div>

                    <div className="w-full bg-slate-100 text-slate-400 h-12 rounded-xl flex items-center justify-center font-bold text-sm">
                        {isKo ? '현재 플랜' : 'Current Plan'}
                    </div>
                </div>

                {/* PRO Plan Card */}
                <div className="bg-white border-[3px] border-[#E85D36] rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-orange-500/10 cursor-pointer hover:shadow-xl active:scale-[0.98] transition-all">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-[#E85D36]" />

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">
                                {isKo ? 'PRO' : 'PRO'}
                            </h2>
                            <span className="text-xs font-bold text-[#E85D36] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">Best</span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-[#E85D36]">
                                $4.99 <span className="text-sm font-bold text-slate-400">/{isKo ? '일' : 'day'}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-400 mt-1">
                                ≈ ¥35 CNY
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#E85D36] shrink-0 mt-0.5 stroke-[3]" />
                            <span className="text-sm font-bold text-slate-800">{isKo ? '전체 도시 무제한' : 'All Cities Unlimited'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#E85D36] shrink-0 mt-0.5 stroke-[3]" />
                            <span className="text-sm font-bold text-slate-800">{isKo ? '10개 언어 + 中文 (简体)' : '10 Languages + 中文 (简体)'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#E85D36] shrink-0 mt-0.5 stroke-[3]" />
                            <span className="text-sm font-bold text-slate-800">{isKo ? '오디오 오프라인 저장' : 'Audio Offline Save'}</span>
                        </div>
                    </div>

                    {/* 결제 버튼 */}
                    <div className="mt-5 space-y-2">
                        <button
                            className="w-full h-12 rounded-xl bg-[#E85D36] hover:bg-[#d04e2c] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
                            onClick={() => window.open(STRIPE_LINKS.monthly, '_blank')}
                        >
                            <Crown className="w-4 h-4" />
                            {isKo ? '월간 구독 시작 — $4.99/월' : 'Start Monthly — $4.99/mo'}
                        </button>
                        <button
                            className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                            onClick={() => window.open(STRIPE_LINKS.annual, '_blank')}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {isKo ? '연간 구독 $39.99/년 (33% 할인!)' : 'Annual $39.99/yr (Save 33%!)'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        {isKo ? '🔒 Stripe 안전 결제 · 언제든 취소 가능' : '🔒 Secure payment via Stripe · Cancel anytime'}
                    </p>
                </div>
            </div>
        </div>
    );
}
