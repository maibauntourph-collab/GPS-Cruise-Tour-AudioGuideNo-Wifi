import { useState } from 'react';
import LandmarkPanel from '@/components/LandmarkPanel';
import { Landmark } from '@shared/schema';

// Mock landmark data based on schema.ts
const mockLandmark: Landmark = {
    id: 'vatican-preview',
    cityId: 'vatican',
    name: '바티칸 박물관 & 시스티나 예배당',
    lat: 41.9064,
    lng: 12.4536,
    radius: 100,
    narration: '바티칸 박물관은 세계에서 가장 큰 박물관 중 하나로, 인류 문명의 보고이자 로마 가톨릭 교회의 심장입니다.',
    description: '바티칸 박물관은 단순한 세계에서 가장 큰 박물관 중 하나가 아니라, 인류 문명의 보고이자 로마 가톨릭 교회의 심장입니다.',
    category: 'Museum',
    detailedDescription: '이 방대한 유산을 제대로 경험하기 위해서는 반드시 사전에 \"이른 아침 입장(Early Access)\" 투어를 예약하여, 일반 관광객의 혼잡을 피해 고요하고 여유롭게 예술 작품들을 감상하는 것을 강력히 추천합니다.',
    photos: [
        'https://images.unsplash.com/photo-1594841763041-3837943f605a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1594841763077-99528d22f676?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    ],
    historicalInfo: '특히 미켈란젤로의 걸작 \"천지창조\"와 \"최후의 심판\"이 장식된 시스티나 예배당은 인간이 도달할 수 있는 예술의 정점을 보여줍니다. 그 웅장함과 세밀함에 압도되어 숨쉬기조차 잊을 정도의 경외감을 선사할 것입니다.',
    yearBuilt: '1506',
    architect: 'Michelangelo, Bramante, Raphael',
    translations: {
        'ko': {
            name: '바티칸 박물관 & 시스티나 예배당',
            narration: '인류 문명의 보고이자 로마 가톨릭 교회의 심장입니다.',
            description: '바티칸 박물관은 단순한 세계에서 가장 큰 박물관 중 하나가 아니라, 인류 문명의 보고이자 로마 가톨릭 교회의 심장입니다.',
            detailedDescription: '이 방대한 유산을 제대로 경험하기 위해서는 반드시 사전에 \"이른 아침 입장(Early Access)\" 투어를 예약하여, 일반 관광객의 혼잡을 피해 고요하고 여유롭게 예술 작품들을 감상하는 것을 강력히 추천합니다.',
            historicalInfo: '특히 미켈란젤로의 걸작 \"천지창조\"와 \"최후의 심판\"이 장식된 시스티나 예배당은 인간이 도달할 수 있는 예술의 정점을 보여줍니다.',
            yearBuilt: '1506',
            architect: '미켈란젤로, 브라만테, 라파엘로'
        }
    }
};

export default function DesignPreview() {
    console.log('[DesignPreview] Rendering...');
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center p-8 overflow-hidden">
            {/* Background decoration for premium feel */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[128px]"></div>
            </div>

            <div className="text-center mb-8 absolute top-12">
                <h1 className="text-3xl font-black text-white/90 tracking-tighter uppercase italic">
                    Landmark Panel <span className="text-blue-500">Design Preview</span>
                </h1>
                <p className="text-slate-500 text-sm mt-2 font-medium tracking-wide">
                    2026-02-25 Optimized Premium UI / [DEBUG MODE]
                </p>
            </div>

            <div className="bg-white p-10 rounded-2xl text-black font-bold text-2xl shadow-2xl">
                Hello! 이 메시지가 보이시나요? (If you see this, basic rendering works)
            </div>

            {/* {isOpen && (
        <LandmarkPanel
          landmark={mockLandmark}
          onClose={() => setIsOpen(false)}
          onNavigate={() => console.log('Navigate')}
          selectedLanguage="ko"
        />
      )} */}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                >
                    Preview 다시 열기
                </button>
            )}
        </div>
    );
}
