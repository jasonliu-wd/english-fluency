import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import LoginPage from '@/features/auth/LoginPage'
import Dashboard from '@/features/dashboard/Dashboard'
import ListeningPage from '@/features/listening/ListeningPage'
import VocabPage from '@/features/vocab/VocabPage'
import WritingPage from '@/features/writing/WritingPage'
import ShadowPage from '@/features/shadow/ShadowPage'
import DrillPage from '@/features/drill/DrillPage'
import SpeakingPage from '@/features/speaking/SpeakingPage'
import PhrasesPage from '@/features/phrases/PhrasesPage'
import ProgressPage from '@/features/progress/ProgressPage'

export default function App() {
  const { setLoading } = useAuthStore()

  useEffect(() => {
    // Login-free single-user mode: clear any persisted session so the app
    // always reads/writes under DEV_USER_ID. Without this, a leftover session
    // flips `user` from null (DEV_USER_ID) to a real auth id mid-render, which
    // makes Review/Write load and then empty out.
    // To restore multi-user auth: re-enable ProtectedRoute and bring back
    // getSession()/onAuthStateChange here.
    supabase.auth.signOut().finally(() => setLoading(false))
  }, [setLoading])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="listening" element={<ListeningPage />} />
          <Route path="vocab" element={<VocabPage />} />
          <Route path="writing" element={<WritingPage />} />
          <Route path="shadow" element={<ShadowPage />} />
          <Route path="drill" element={<DrillPage />} />
          <Route path="speaking" element={<SpeakingPage />} />
          <Route path="phrases" element={<PhrasesPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
