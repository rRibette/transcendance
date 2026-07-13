import { useNavigate } from 'react-router'
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  	<App/>
)
