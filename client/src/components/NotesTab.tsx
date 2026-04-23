/**
 * NotesTab — 개인 메모 + 스마트 체크리스트 (IndexedDB 저장, 오프라인 완전 지원)
 * 색상 테마: violet-500 / purple-600
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Check, Plus, RotateCcw, X } from 'lucide-react';

interface NotesTabProps {
  landmarkId: number;
  landmarkName: string;
  city: string;
  language?: string;
}

interface CheckItem {
  id: string;
  label: string;
  emoji: string;
  custom?: boolean;
}

interface ChecklistState {
  checked: Record<string, boolean>;
  customItems: CheckItem[];
}

const CHECKLIST_TEMPLATES: CheckItem[] = [
  { id: 'sunscreen', label: '선크림 챙기기',         emoji: '🧴' },
  { id: 'camera',    label: '카메라/충전기',          emoji: '📷' },
  { id: 'cash',      label: '현금 환전',              emoji: '💵' },
  { id: 'passport',  label: '여권/신분증',            emoji: '🛂' },
  { id: 'water',     label: '물/음료 준비',           emoji: '💧' },
  { id: 'shoes',     label: '편한 신발',              emoji: '👟' },
  { id: 'map',       label: '오프라인 지도 다운로드', emoji: '🗺️' },
  { id: 'ship_time', label: '승선 마감시간 확인',     emoji: '⏰' },
];

const I18N: Record<string, Record<string, string>> = {
  ko: {
    noteTitle: '📝 내 메모', notePlaceholder: '이 랜드마크에 대한 메모를 입력하세요...',
    saving: '저장 중...', saved: '✓ 저장됨', charCount: '자',
    checklistTitle: '✅ 체크리스트', progress: '완료',
    resetAll: '전체 초기화', addItem: '항목 추가...', addBtn: '추가',
    resetConfirm: '체크리스트를 초기화할까요?',
    sunscreen: '선크림 챙기기', camera: '카메라/충전기', cash: '현금 환전',
    passport: '여권/신분증', water: '물/음료 준비', shoes: '편한 신발',
    map: '오프라인 지도 다운로드', ship_time: '승선 마감시간 확인',
  },
  en: {
    noteTitle: '📝 My Notes', notePlaceholder: 'Write your notes about this landmark...',
    saving: 'Saving...', saved: '✓ Saved', charCount: ' chars',
    checklistTitle: '✅ Checklist', progress: 'done',
    resetAll: 'Reset All', addItem: 'Add item...', addBtn: 'Add',
    resetConfirm: 'Reset the checklist?',
    sunscreen: 'Sunscreen', camera: 'Camera / Charger', cash: 'Cash exchange',
    passport: 'Passport / ID', water: 'Water / Drinks', shoes: 'Comfortable shoes',
    map: 'Download offline map', ship_time: 'Check boarding time',
  },
};

function t(lang: string, key: string): string {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

function localizeLabel(lang: string, item: CheckItem): string {
  if (item.custom) return item.label;
  return t(lang, item.id) || item.label;
}

const openNotesDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open('gps-audio-guide-notes', 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('checklist')) db.createObjectStore('checklist', { keyPath: 'id' });
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = reject;
  });

const saveNote = async (landmarkId: number, text: string): Promise<void> => {
  const db = await openNotesDB();
  const tx = db.transaction('notes', 'readwrite');
  await new Promise<void>((resolve, reject) => {
    const req = tx.objectStore('notes').put({ id: landmarkId, text, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = reject;
  });
};

const loadNote = async (landmarkId: number): Promise<string> => {
  const db = await openNotesDB();
  const tx = db.transaction('notes', 'readonly');
  return new Promise((resolve) => {
    const req = tx.objectStore('notes').get(landmarkId);
    req.onsuccess = () => resolve((req.result as any)?.text || '');
    req.onerror = () => resolve('');
  });
};

const saveChecklist = async (landmarkId: number, state: ChecklistState): Promise<void> => {
  const db = await openNotesDB();
  const tx = db.transaction('checklist', 'readwrite');
  await new Promise<void>((resolve, reject) => {
    const req = tx.objectStore('checklist').put({ id: landmarkId, state, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = reject;
  });
};

const loadChecklist = async (landmarkId: number): Promise<ChecklistState | null> => {
  const db = await openNotesDB();
  const tx = db.transaction('checklist', 'readonly');
  return new Promise((resolve) => {
    const req = tx.objectStore('checklist').get(landmarkId);
    req.onsuccess = () => resolve((req.result as any)?.state || null);
    req.onerror = () => resolve(null);
  });
};

export default function NotesTab({ landmarkId, landmarkName: _landmarkName, city: _city, language = 'ko' }: NotesTabProps) {
  const lang = I18N[language] ? language : 'en';
  const [noteText, setNoteText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<CheckItem[]>([]);
  const [newItemInput, setNewItemInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [note, clState] = await Promise.all([loadNote(landmarkId), loadChecklist(landmarkId)]);
      if (cancelled) return;
      setNoteText(note);
      if (clState) { setChecked(clState.checked || {}); setCustomItems(clState.customItems || []); }
      else { setChecked({}); setCustomItems([]); }
      setSaveStatus('idle');
    })();
    return () => { cancelled = true; };
  }, [landmarkId]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 500);
    setNoteText(value);
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await saveNote(landmarkId, value);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, [landmarkId]);

  const toggleCheck = useCallback(async (id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecklist(landmarkId, { checked: next, customItems });
      return next;
    });
  }, [landmarkId, customItems]);

  const addCustomItem = useCallback(async () => {
    const label = newItemInput.trim();
    if (!label) return;
    const newItem: CheckItem = { id: `custom_${Date.now()}`, label, emoji: '📌', custom: true };
    setCustomItems(prev => {
      const next = [...prev, newItem];
      saveChecklist(landmarkId, { checked, customItems: next });
      return next;
    });
    setNewItemInput('');
    inputRef.current?.focus();
  }, [landmarkId, newItemInput, checked]);

  const removeCustomItem = useCallback(async (id: string) => {
    setCustomItems(prev => {
      const next = prev.filter(item => item.id !== id);
      setChecked(prevChecked => {
        const nextChecked = { ...prevChecked };
        delete nextChecked[id];
        saveChecklist(landmarkId, { checked: nextChecked, customItems: next });
        return nextChecked;
      });
      return next;
    });
  }, [landmarkId]);

  const resetChecklist = useCallback(async () => {
    if (!window.confirm(t(lang, 'resetConfirm'))) return;
    setChecked({}); setCustomItems([]);
    await saveChecklist(landmarkId, { checked: {}, customItems: [] });
  }, [landmarkId, lang]);

  const allItems = [...CHECKLIST_TEMPLATES, ...customItems];
  const checkedCount = allItems.filter(item => checked[item.id]).length;
  const totalCount = allItems.length;

  return (
    <div className="flex flex-col gap-4 px-1 py-2">
      {/* 섹션 1: 내 메모 */}
      <div className="rounded-2xl bg-white border border-violet-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">{t(lang, 'noteTitle')}</h3>
          <span className={`text-[11px] font-semibold transition-colors ${
            saveStatus === 'saving' ? 'text-violet-400' :
            saveStatus === 'saved'  ? 'text-emerald-500' : 'text-transparent'
          }`}>
            {saveStatus === 'saving' ? t(lang, 'saving') : saveStatus === 'saved' ? t(lang, 'saved') : '.'}
          </span>
        </div>
        <textarea
          value={noteText}
          onChange={handleNoteChange}
          placeholder={t(lang, 'notePlaceholder')}
          maxLength={500}
          rows={5}
          className="w-full resize-none rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-shadow"
        />
        <div className="flex justify-end mt-1.5">
          <span className={`text-[10px] font-medium ${noteText.length >= 500 ? 'text-rose-500' : 'text-gray-400'}`}>
            {noteText.length} / 500{t(lang, 'charCount')}
          </span>
        </div>
      </div>

      {/* 섹션 2: 체크리스트 */}
      <div className="rounded-2xl bg-white border border-violet-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">{t(lang, 'checklistTitle')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
              {checkedCount}/{totalCount} {t(lang, 'progress')}
            </span>
            <button onClick={resetChecklist} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-rose-500 transition-colors" title={t(lang, 'resetAll')}>
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="w-full h-1.5 bg-violet-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-400 to-purple-600 rounded-full transition-all duration-500" style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }} />
        </div>
        <ul className="space-y-2 mb-3">
          {CHECKLIST_TEMPLATES.map(item => (
            <ChecklistItem key={item.id} item={item} label={localizeLabel(lang, item)} isChecked={!!checked[item.id]} onToggle={() => toggleCheck(item.id)} />
          ))}
        </ul>
        {customItems.length > 0 && (
          <ul className="space-y-2 mb-3 border-t border-dashed border-violet-100 pt-3">
            {customItems.map(item => (
              <ChecklistItem key={item.id} item={item} label={item.label} isChecked={!!checked[item.id]} onToggle={() => toggleCheck(item.id)} onRemove={() => removeCustomItem(item.id)} />
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-2 border-t border-violet-50 pt-3">
          <input
            ref={inputRef} type="text" value={newItemInput}
            onChange={e => setNewItemInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem(); } }}
            placeholder={t(lang, 'addItem')} maxLength={60}
            className="flex-1 rounded-lg border border-violet-200 bg-violet-50/40 px-3 py-1.5 text-[12px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-shadow"
          />
          <button onClick={addCustomItem} disabled={!newItemInput.trim()} className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-200 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3 h-3" />
            {t(lang, 'addBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ item, label, isChecked, onToggle, onRemove }: {
  item: CheckItem; label: string; isChecked: boolean; onToggle: () => void; onRemove?: () => void;
}) {
  return (
    <li className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer select-none transition-colors hover:bg-violet-50 active:bg-violet-100 ${isChecked ? 'opacity-60' : ''}`} onClick={onToggle}>
      <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-violet-500 border-violet-500' : 'border-violet-300 bg-white'}`}>
        {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span className="text-base leading-none">{item.emoji}</span>
      <span className={`flex-1 text-[13px] text-gray-800 transition-all ${isChecked ? 'line-through text-gray-400' : ''}`}>{label}</span>
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-300 hover:text-rose-400 transition-colors">
          <X className="w-3 h-3" />
        </button>
      )}
    </li>
  );
}
