import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Prevent unhandled promise rejections from leaving a blank screen during demo/production
window.addEventListener('unhandledrejection', (event) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled promise rejection:', event.reason);
  }
  event.preventDefault();
  event.stopPropagation();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
