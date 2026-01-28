import React, { useState, useEffect, useCallback } from 'react';

const ControlLayer = ({ children, className }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Activity handler attached to window to ensure we catch movement even over dragging/video
    const handleActivity = useCallback(() => {
        setIsVisible(true);
        setLastActivity(Date.now());
    }, []);

    useEffect(() => {
        // Global listeners for activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        const checkInactivity = setInterval(() => {
            if (Date.now() - lastActivity > 3000) {
                setIsVisible(false);
            }
        }, 1000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            clearInterval(checkInactivity);
        };
    }, [handleActivity, lastActivity]);

    return (
        <div
            className={`absolute inset-0 z-30 transition-opacity duration-300 pointer-events-none ${className || ''}`}
        >
            {/* 
                We pass `isVisible` state to children.
                Children must have 'pointer-events-auto' to be clickable.
            */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { isVisible });
                }
                return child;
            })}
        </div>
    );
};

export default ControlLayer;
