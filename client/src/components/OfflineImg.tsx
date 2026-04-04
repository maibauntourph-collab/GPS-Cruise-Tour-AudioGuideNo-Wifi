import React from 'react';
import { useOfflineImage } from '../hooks/useOfflineImage';
import { motion, HTMLMotionProps } from 'framer-motion';

interface OfflineImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    landmarkId?: string;
}

/**
 * [Designer Kim | 2026-04-04] <OfflineImg />
 * 오프라인 이미지 캐싱 전략이 내장된 <img> 드롭인 컴포넌트입니다.
 */
export const OfflineImg: React.FC<OfflineImgProps> = ({ src, landmarkId, ...props }) => {
    const finalSrc = useOfflineImage(src, landmarkId);
    return <img src={finalSrc || src} {...props} />;
};

/**
 * [Designer Kim | 2026-04-04] <OfflineMotionImg />
 * Framer Motion 속성을 지원하는 오프라인 이미지 컴포넌트입니다.
 */
export const OfflineMotionImg: React.FC<HTMLMotionProps<'img'> & { landmarkId?: string }> = ({
    src,
    landmarkId,
    ...props
}) => {
    const finalSrc = useOfflineImage(src, landmarkId);
    return <motion.img src={finalSrc || src} {...props} />;
};
