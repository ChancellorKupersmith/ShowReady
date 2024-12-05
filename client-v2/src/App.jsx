import React, {useState, Suspense, startTransition, createContext, useContext} from 'react';
import './styles/base.css';
import './styles/theme.css';
import './styles/layout/root.css';

const MapView = React.lazy(() => import('./views/Map/MapView.jsx'));
const HomeView = React.lazy(() => import('./views/Home/HomeView.jsx'));
const LazyView = ({ child }) => (
  <Suspense fallback={<div>Loading...</div>}>
    { child }
  </Suspense>
);

const ViewContext = createContext();
export const useViewContext = () => useContext(ViewContext);
export const ViewContextProvider = ({ children }) => {
  const [currentView, updateCurrentView] = useState('home');
  const handleViewChange = view => {
    startTransition(() => updateCurrentView(view));
  };

  return (
    <ViewContext.Provider value={{ currentView, handleViewChange }}>
      { children }
    </ViewContext.Provider>
  );
};

function App() {
  const { currentView } = useViewContext();
  let view;
  switch(currentView){
    case 'map':
      view = <MapView />;
      break;
    default:
      view = <HomeView />;
      break;
  }
  return <LazyView child={view}/>;
}


export default App;
