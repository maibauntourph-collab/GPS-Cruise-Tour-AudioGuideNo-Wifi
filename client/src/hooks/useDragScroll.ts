import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * [Avengers Team | Designer Kim] useDragScroll Hook
 * 학생들: 데스크탑에서도 모바일처럼 마우스로 '잡고 끌어서' 스크롤할 수 있게 해주는 기능입니다.
 * 
 * @param direction - 'vertical', 'horizontal', or 'both'
 */
export function useDragScroll(direction: 'vertical' | 'horizontal' | 'both' = 'vertical') {
    const ref = useRef<HTMLDivElement>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;

        // 버튼이나 입력창에서는 드래그 스크롤을 방지합니다.
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('a')) {
            return;
        }

        setIsMouseDown(true);
        setIsDragging(false);

        setStartX(e.pageX - ref.current.offsetLeft);
        setStartY(e.pageY - ref.current.offsetTop);
        setScrollLeft(ref.current.scrollLeft);
        setScrollTop(ref.current.scrollTop);

        // 텍스트 선택 방지
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsMouseDown(false);
        setIsDragging(false);
        document.body.style.userSelect = '';
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsMouseDown(false);
        // 약간의 지연을 주어 클릭 이벤트와 겹치지 않게 합니다.
        setTimeout(() => setIsDragging(false), 50);
        document.body.style.userSelect = '';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isMouseDown || !ref.current) return;

        const x = e.pageX - ref.current.offsetLeft;
        const y = e.pageY - ref.current.offsetTop;

        const walkX = (x - startX) * 1.5; // 스크롤 속도 배율
        const walkY = (y - startY) * 1.5;

        // 일정 거리 이상 움직였을 때만 드래그로 간주
        if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
            setIsDragging(true);
        }

        if (direction === 'horizontal' || direction === 'both') {
            ref.current.scrollLeft = scrollLeft - walkX;
        }
        if (direction === 'vertical' || direction === 'both') {
            ref.current.scrollTop = scrollTop - walkY;
        }
    }, [isMouseDown, startX, startY, scrollLeft, scrollTop, direction]);

    useEffect(() => {
        if (isMouseDown) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMouseDown, handleMouseMove, handleMouseUp]);

    return {
        ref,
        onMouseDown: handleMouseDown,
        onMouseLeave: handleMouseLeave,
        onMouseUp: handleMouseUp,
        isDragging // 클릭 이벤트 처리 시 이 값을 체크하여 드래그 중에는 클릭을 무시할 수 있습니다.
    };
}
