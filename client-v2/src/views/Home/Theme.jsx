import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();
export const useThemeData = () => useContext(ThemeContext);
export const ThemeContextProvider = ({children}) => {
    const [ theme, setTheme ] = useState(null);
    const applyTheme = theme => {
        if(theme) {
            document.body.style.colorScheme = theme;
            setTheme(theme);
        }
    }
    const toggleTheme = () => setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    
    // Effect to detect system theme and set it initially
    useEffect(() => {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const savedTheme = localStorage.getItem('theme');
        // priotize saved, default system
        const initialTheme = savedTheme || systemTheme;
        applyTheme(initialTheme);
    }, []);

    // Effect to update theme when state changes
    useEffect(() => {
        console.log(theme)
        if (theme) {
            localStorage.setItem('theme', theme);
            applyTheme(theme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, applyTheme, toggleTheme }}>
            { children }
        </ThemeContext.Provider>
    );
}