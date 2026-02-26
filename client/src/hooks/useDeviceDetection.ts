import { useState, useEffect } from 'react';
import { DeviceCapabilities, detectDeviceCapabilities } from '@/lib/deviceDetection';

export function useDeviceDetection(): DeviceCapabilities {
    const [capabilities, setCapabilities] = useState<DeviceCapabilities>(detectDeviceCapabilities());

    useEffect(() => {
        // Initial detection
        setCapabilities(detectDeviceCapabilities());
    }, []);

    return capabilities;
}

export const useDeviceCapabilities = useDeviceDetection;
