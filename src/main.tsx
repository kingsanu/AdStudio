import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:4000/api';
ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
)
