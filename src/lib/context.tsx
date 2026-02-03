'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings, User, Year, Month, Day } from './types';

interface AppState {
    settings: Settings;
    years: Year[];
    months: Month[];
    days: Day[];
    currentUser: { id: string; username: string; fullname: string } | null;
    selectedYear: string;
    isLoading: boolean;
    isAdmin: boolean;
}

interface AppContextType extends AppState {
    setSettings: (settings: Settings) => void;
    setYears: (years: Year[]) => void;
    setMonths: (months: Month[]) => void;
    setDays: (days: Day[]) => void;
    setCurrentUser: (user: { id: string; username: string; fullname: string } | null) => void;
    setSelectedYear: (year: string) => void;
    setIsLoading: (loading: boolean) => void;
    setIsAdmin: (admin: boolean) => void;
    refreshData: () => Promise<void>;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({
        schoolName: '',
        educationOffice: '',
        schoolLogo: '',
    });
    const [years, setYears] = useState<Year[]>([]);
    const [months, setMonths] = useState<Month[]>([]);
    const [days, setDays] = useState<Day[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: string; username: string; fullname: string } | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [settingsRes, yearsRes, monthsRes, daysRes] = await Promise.all([
                fetch('/api/settings'),
                fetch('/api/years'),
                fetch('/api/months'),
                fetch('/api/days'),
            ]);

            const [settingsData, yearsData, monthsData, daysData] = await Promise.all([
                settingsRes.json(),
                yearsRes.json(),
                monthsRes.json(),
                daysRes.json(),
            ]);

            // Validate and set settings
            if (settingsData && !settingsData.error) {
                setSettings(settingsData);
            }

            // Validate and set arrays - ensure they are actually arrays
            const validYears = Array.isArray(yearsData) ? yearsData : [];
            const validMonths = Array.isArray(monthsData) ? monthsData : [];
            const validDays = Array.isArray(daysData) ? daysData : [];

            setYears(validYears);
            setMonths(validMonths);
            setDays(validDays);

            // Set default selected year
            if (validYears.length > 0 && !selectedYear) {
                const currentYear = validYears.find((y: Year) => y.isCurrent);
                setSelectedYear(currentYear?.id || validYears[0].id);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            // Set empty arrays on error
            setYears([]);
            setMonths([]);
            setDays([]);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (data.success) {
                setCurrentUser(data.user);
                setIsAdmin(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setIsAdmin(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <AppContext.Provider
            value={{
                settings,
                years,
                months,
                days,
                currentUser,
                selectedYear,
                isLoading,
                isAdmin,
                setSettings,
                setYears,
                setMonths,
                setDays,
                setCurrentUser,
                setSelectedYear,
                setIsLoading,
                setIsAdmin,
                refreshData,
                login,
                logout,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
