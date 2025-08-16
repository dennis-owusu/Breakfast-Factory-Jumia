import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { persistor, store } from './redux/store'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from './context/ThemeContext';


ReactDOM.createRoot(document.getElementById('root')).render(
   <PersistGate persistor={persistor}>
     <Provider store={store}>
       <ThemeProvider>
         <App />
       </ThemeProvider>
     </Provider>
   </PersistGate>
)