import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import LoginPage from '@/features/auth/LoginPage'
import Dashboard from '@/features/dashboard/Dashboard'
import VocabPage from '@/features/vocab/VocabPage'
import WritingPage from '@/features/writing/WritingPage'
import ShadowPage from '@/features/shadow/ShadowPage'
import DrillPage from '@/features/drill/DrillPage'
import SpeakingPage from '@/features/speaking/SpeakingPage'
import PhrasesPage from '@/features/phrases/PhrasesPage'
import ProgressPage from '@/features/progress/ProgressPage'

export default function App() {
  const { setSession, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

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
