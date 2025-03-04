import React, { createContext, useContext, useState, useEffect } from "react";
import MoonSvg from '../../assets/moon.svg';
import SunSvg from '../../assets/sun.svg';

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
        // console.log(theme)
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

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeData();
  
    const handleThemeToggle = () => {
      toggleTheme();
      document.documentElement.classList.toggle('dark');
    };
  
    const styles = {
      moon: {
        transform: `rotate(${theme == 'dark' ? '0deg' : '-90deg'})`,
        opacity: theme == 'dark' ? 1 : 0,
      },
      sun: {
        transform: `rotate(${theme == 'dark' ? '90deg' : '0deg'})`,
        opacity: theme == 'dark' ? 0 : 1,
      },
    };
  
    return (
      <button className='theme-toggle' onClick={handleThemeToggle}>
        <div className='theme-icon-container'>
          <div className='theme-icon-wrapper' style={styles.moon}>
            <img
              loading="lazy"
              src={MoonSvg}
              alt='dark theme'
            />
          </div>
          <div style={styles.sun}>
            <img
              loading="lazy"
              src={SunSvg}
              alt='light theme'
            />
          </div>
        </div>
      </button>
    );
};