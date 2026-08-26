import { useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('govaiUser'))
  const [authMode, setAuthMode] = useState('register')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [language, setLanguage] = useState('English')
  const [activeView, setActiveView] = useState('Ask GovAI')
  const [question, setQuestion] = useState('')
  const [submittedQuestion, setSubmittedQuestion] = useState('')
  const [backendAnswer, setBackendAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState({ education: 'B.Tech', state: 'Andhra Pradesh', category: 'General', income: '' })

  const schemes = [
    { name: 'Post-Matric Scholarship', tag: 'Education', detail: 'For students pursuing higher education after Class 10.', source: 'National Scholarship Portal', fit: '92%' },
    { name: 'PM YASASVI Scholarship', tag: 'Merit-based', detail: 'Support for bright students from selected communities.', source: 'Ministry of Social Justice', fit: '78%' },
    { name: 'Jagananna Vidya Deevena', tag: 'Andhra Pradesh', detail: 'Fee reimbursement for eligible students in professional courses.', source: 'AP Government', fit: '86%' },
  ]

  const submitQuestion = async (event) => {
    event.preventDefault()
    if (!question.trim()) return
    const submitted = question.trim()
    setSubmittedQuestion(submitted)
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: submitted, language, profile }),
      })
      if (!response.ok) throw new Error('Backend request failed')
      const data = await response.json()
      setBackendAnswer(data.answer)
    } catch {
      setBackendAnswer('The backend is not running yet. Start CapstoneServer.java in Eclipse and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }))

  const submitAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/${authMode === 'signin' ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Authentication failed')
      if (authMode === 'register') {
        setAuthMode('signin')
        setAuthForm({ name: '', email: authForm.email, password: '' })
        setAuthMessage('Account created. Sign in to continue.')
      } else {
        setAuthUser(data.name || authForm.email.split('@')[0])
        localStorage.setItem('govaiUser', data.name || authForm.email.split('@')[0])
      }
    } catch (error) {
      setAuthError(error.message || 'Could not connect to the backend.')
      setAuthMessage('')
    } finally { setAuthLoading(false) }
  }

  const signOut = () => { setAuthUser(null); localStorage.removeItem('govaiUser') }

  if (!authUser) return <div className="auth-shell"><div className="auth-visual"><div className="brand"><span className="brand-mark">G</span><span>Gov<span className="brand-accent">AI</span></span></div><div className="auth-quote"><span className="eyebrow">CIVIC INTELLIGENCE FOR EVERYONE</span><h1>Government support,<br /><em>made understandable.</em></h1><p>Ask questions in your language. Discover the schemes and benefits made for your situation.</p><div className="language-strip"><span>English</span><span>తెలుగు</span><span>हिन्दी</span><span>தமிழ்</span></div></div><span className="auth-foot">Built for a more accessible India.</span></div><main className="auth-card"><div className="auth-card-top"><span className="eyebrow">WELCOME TO GOVAI</span><h2>{authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}</h2><p>{authMode === 'signin' ? 'Continue your journey to better benefits.' : 'Save your profile and find support made for you.'}</p></div><form className="auth-form" onSubmit={submitAuth}>{authMode === 'register' && <label>Full name<input required value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Arjun Sharma" /></label>}<label>Email address<input required type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<input required minLength="6" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="At least 6 characters" /></label>{authMessage && <p className="auth-success">{authMessage}</p>}{authError && <p className="auth-error">{authError}</p>}<button className="auth-submit" disabled={authLoading}>{authLoading ? 'Connecting...' : authMode === 'signin' ? 'Sign in' : 'Create account'} <span>→</span></button></form><div className="auth-switch">{authMode === 'signin' ? 'New to GovAI?' : 'Already have an account?'} <button onClick={() => { setAuthMode(authMode === 'signin' ? 'register' : 'signin'); setAuthError(''); setAuthMessage('') }}>{authMode === 'signin' ? 'Create an account' : 'Sign in instead'}</button></div><p className="auth-note">Your information is used only to personalize your experience.</p></main></div>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">G</span><span>Gov<span className="brand-accent">AI</span></span></div>
        <p className="sidebar-kicker">Your civic intelligence layer</p>
        <nav className="main-nav" aria-label="Main navigation">
          {['Ask GovAI', 'My Eligibility', 'Saved Schemes'].map((item, index) => (
            <button className={activeView === item ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView(item)} key={item}>
              <span className="nav-icon">{['+', '◌', '▱'][index]}</span>{item}{index === 2 && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><div><strong>Need help?</strong><span>Talk to our support team</span></div><span className="arrow">↗</span></div><div className="user-row"><div className="avatar">AS</div><div><strong>{authUser}</strong><span>Citizen account</span></div><button className="more sign-out" onClick={signOut}>Logout</button></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">{activeView === 'Ask GovAI' ? 'PERSONALIZED ASSISTANCE' : 'YOUR PROFILE'}</span><h1>{activeView}</h1></div><div className="header-actions"><button className="icon-button" aria-label="Notifications">♧<span className="notification-dot" /></button><label className="language-select"><span>文</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language"><option value="English">English</option><option value="Telugu">తెలుగు</option><option value="Hindi">हिन्दी</option><option value="Tamil">தமிழ்</option></select></label></div></header>
        {activeView === 'Ask GovAI' ? <>
          <section className="welcome-row"><div><h2>Good morning, Arjun <span className="sun">✦</span></h2><p>Find the government support you are entitled to.</p></div><div className="status-pill"><span className="status-dot" /> Knowledge base updated <strong>today</strong></div></section>
          <section className="ask-grid"><div className="conversation-panel panel"><div className="panel-heading"><div><span className="panel-label">CONVERSATION</span><h3>How can I help you today?</h3></div><button className="clear-button" onClick={() => { setSubmittedQuestion(''); setBackendAnswer('') }}>Clear chat</button></div><div className="chat-area"><div className="message assistant"><div className="bot-avatar">G</div><div><span className="message-meta">GovAI <time>09:41 AM</time></span><p>Namaste, Arjun! Tell me what you need help with. You can ask me about scholarships, subsidies, certificates, or any government scheme.</p><div className="suggestions"><button onClick={() => setQuestion('What scholarships are available for students?')}>Student scholarships <span>→</span></button><button onClick={() => setQuestion('Check my eligibility for a housing scheme')}>Housing schemes <span>→</span></button></div></div></div>{submittedQuestion && <div className="message user"><div><span className="message-meta">You <time>now</time></span><p>{submittedQuestion}</p></div><div className="avatar small">AS</div></div>}{isLoading && <p className="loading-message">GovAI is checking the backend...</p>}{backendAnswer && <div className="message assistant backend-message"><div className="bot-avatar">G</div><div><span className="message-meta">GovAI <time>just now</time></span><p>{backendAnswer}</p></div></div>}</div><form className="composer" onSubmit={submitQuestion}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask in English, Telugu, Hindi..." aria-label="Ask GovAI a question" /><button type="button" className="voice-button" aria-label="Voice input">◉</button><button className="send-button" type="submit" aria-label="Send question" disabled={isLoading}>↑</button></form><div className="composer-note"><span>GovAI can make mistakes. Verify important information.</span><span>⌘ Enter to send</span></div></div><aside className="profile-panel panel"><div className="panel-heading"><div><span className="panel-label">YOUR PROFILE</span><h3>Personalize your results</h3></div><span className="edit-mark">✎</span></div><p className="profile-intro">Share a few details to see schemes matched to your situation.</p><div className="form-fields"><label>Education level<select value={profile.education} onChange={(event) => updateProfile('education', event.target.value)}><option>B.Tech</option><option>Undergraduate</option><option>Postgraduate</option><option>Class 10-12</option></select></label><label>State / Union Territory<select value={profile.state} onChange={(event) => updateProfile('state', event.target.value)}><option>Andhra Pradesh</option><option>Telangana</option><option>Karnataka</option><option>Delhi</option></select></label><label>Social category<select value={profile.category} onChange={(event) => updateProfile('category', event.target.value)}><option>General</option><option>OBC</option><option>SC</option><option>ST</option></select></label><label>Annual family income <span className="optional">Optional</span><input value={profile.income} onChange={(event) => updateProfile('income', event.target.value)} placeholder="e.g. Rs 3,00,000" /></label></div><button className="profile-button" onClick={() => setQuestion(`What schemes am I eligible for as a ${profile.education} student in ${profile.state}?`)}>Update my profile <span>→</span></button></aside></section>
          <section className="matched-section"><div className="section-heading"><div><span className="panel-label">BASED ON YOUR PROFILE</span><h3>Potential schemes <span className="result-count">3 results</span></h3></div><button className="text-button">View all schemes <span>↗</span></button></div><div className="scheme-grid">{schemes.map((scheme) => <article className="scheme-card" key={scheme.name}><div className="scheme-top"><span className="scheme-icon">✥</span><span className="match">{scheme.fit} match</span></div><span className="scheme-tag">{scheme.tag}</span><h4>{scheme.name}</h4><p>{scheme.detail}</p><div className="scheme-foot"><span>Source: {scheme.source}</span><button aria-label={`Save ${scheme.name}`}>♡</button></div></article>)}</div></section>
        </> : <section className="profile-view panel"><span className="panel-label">{activeView.toUpperCase()}</span><h2>{activeView === 'My Eligibility' ? 'Your eligibility profile' : 'Your saved schemes'}</h2><p>{activeView === 'My Eligibility' ? 'Keep your details current to improve every recommendation.' : 'Schemes you save will appear here for quick access.'}</p><button className="profile-button" onClick={() => setActiveView('Ask GovAI')}>Return to Ask GovAI <span>→</span></button></section>}
        <footer><span>GovAI uses official government sources wherever available.</span><span>Privacy · Accessibility · About</span></footer>
      </main>
    </div>
  )
}

export default App
