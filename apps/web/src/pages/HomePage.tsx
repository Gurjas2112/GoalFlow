import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    { icon: '🎯', title: 'Goal Setting & Alignment', desc: 'Employees set clear, measurable goals aligned with organizational priorities. Managers review and approve, ensuring perfect alignment.' },
    { icon: '📊', title: 'Real-Time Progress Tracking', desc: 'Log quarterly achievements with automatic score calculation. Managers conduct structured check-ins and provide feedback.' },
    { icon: '👥', title: 'Manager Oversight', desc: 'Team dashboards with instant visibility. Approve goals, conduct check-ins, and track performance all in one place.' },
    { icon: '🔐', title: 'Audit-Ready Governance', desc: 'Complete audit trail of all changes. Locked goals prevent tampering, and all modifications are logged with timestamps.' },
    { icon: '⚡', title: 'Smart Scoring Engine', desc: '4 UoM types (Numeric Max, Numeric Min, Timeline, Zero) with auto-calculated scores. Weightage-based composite scoring.' },
    { icon: '📧', title: 'Notifications & Escalations', desc: 'Email + MS Teams alerts for approvals, deadlines. Automated escalation rules for overdue goals.' },
  ];

  const stats = [
    { number: '100%', label: 'Goal Coverage', sub: 'All employees' },
    { number: '4', label: 'Quarterly Cycles', sub: 'Per year' },
    { number: '8', label: 'Goals Maximum', sub: 'Per employee' },
    { number: '∞', label: 'Scalable', sub: 'Any org size' },
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', role: 'Senior Engineer', avatar: '👨‍💼', quote: 'GoalFlow made goal tracking so simple. I know exactly what I need to achieve and how it connects to the company.' },
    { name: 'Priya Patel', role: 'Engineering Manager', avatar: '👩‍💼', quote: 'As a manager, this dashboard gives me real-time visibility. No more spreadsheet chaos. Approvals are smooth.' },
    { name: 'Amit Sharma', role: 'HR Director', avatar: '👨‍💻', quote: 'Audit trail is comprehensive. Appraisal data is accurate and timely. Escalations keep everyone accountable.' },
  ];

  const faqItems = [
    { q: 'How does the scoring system work?', a: 'GoalFlow auto-calculates achievement scores based on UoM type. For revenue target $1M with $850K achieved, score = 85%. Different UoM types use different formulas.' },
    { q: 'Can goals be changed after approval?', a: 'No, once approved by your manager, goals are locked. Only admins can unlock, and all changes are logged in the audit trail.' },
    { q: 'How often do I update achievements?', a: 'There are 4 quarterly check-in windows (Q1-Q4). You log actual achievements during these windows. The system enforces these dates.' },
    { q: 'What happens if I miss a deadline?', a: 'Escalation rules notify you, your manager, and HR. The escalation log helps track and resolve overdue items.' },
    { q: 'Can I share goals with my team?', a: 'Yes! Managers can push departmental KPIs to multiple employees. Recipients can adjust weightage but goals remain locked.' },
    { q: 'Is my data secure?', a: 'Yes. GoalFlow uses PostgreSQL, JWT auth, RBAC, Azure AD SSO, and complete audit trails for enterprise-grade security.' },
  ];

  const s = {
    page: { minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' as const, overflow: 'hidden' as const },
    nav: { background: 'rgba(5,10,24,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', position: 'sticky' as const, top: 0, zIndex: 50 },
    navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 },
    brand: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
    brandLogo: { width: 36, height: 36, borderRadius: 10 },
    brandText: { fontSize: '1.4rem', fontWeight: 900, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto' },
    navBtns: { display: 'flex', gap: 12 },
    btnOutline: { padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font)' },
    btnGrad: { padding: '8px 24px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', border: 'none', borderRadius: 10, background: 'var(--gradient-1)', cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' },
    hero: { maxWidth: 1200, margin: '0 auto', padding: '80px 2rem 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
    heroH1: { fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--text)' },
    heroGrad: { background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    heroP: { fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 20 },
    heroCta: { display: 'flex', gap: 16, marginTop: 36 },
    heroBtn: { padding: '14px 32px', fontSize: '1rem', fontWeight: 700, color: '#fff', border: 'none', borderRadius: 14, background: 'var(--gradient-1)', cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,102,241,0.35)', transition: 'var(--transition)', fontFamily: 'var(--font)' },
    heroBtnSec: { padding: '14px 32px', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-hover)', border: '2px solid var(--border-hover)', borderRadius: 14, background: 'var(--accent-glow)', cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font)' },
    heroVisual: { position: 'relative' as const, height: 420 },
    heroCard: { position: 'relative' as const, height: '100%', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))', border: '1px solid var(--border-hover)', borderRadius: 20, backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 40, overflow: 'hidden' as const },
    statsGrid: { maxWidth: 1200, margin: '0 auto', padding: '0 2rem 80px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 20px', textAlign: 'center' as const, transition: 'var(--transition)', cursor: 'default' },
    section: { padding: '80px 0', background: 'rgba(0,0,0,0.2)' },
    sectionInner: { maxWidth: 1200, margin: '0 auto', padding: '0 2rem' },
    sectionTitle: { fontSize: '2.5rem', fontWeight: 900, textAlign: 'center' as const, color: 'var(--text)', letterSpacing: '-0.03em' },
    sectionSub: { fontSize: '1.05rem', color: 'var(--text-secondary)', textAlign: 'center' as const, marginTop: 12, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' },
    featGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 48 },
    featCard: { padding: 28, borderRadius: 16, border: '2px solid', cursor: 'pointer', transition: 'var(--transition)' },
    testGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 48 },
    testCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, transition: 'var(--transition)' },
    faqList: { maxWidth: 800, margin: '48px auto 0', display: 'flex', flexDirection: 'column' as const, gap: 12 },
    ctaSection: { padding: '80px 0', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06), rgba(236,72,153,0.04))' },
    footer: { background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border)', padding: '48px 0 32px' },
  };

  return (
    <div style={s.page}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', top: '-5%', left: '5%' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.07), transparent 70%)', bottom: '10%', right: '10%' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06), transparent 70%)', top: '40%', left: '50%' }} />
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand}>
            <img src="/logo.png" alt="GoalFlow" style={s.brandLogo} />
            <span style={s.brandText}>GoalFlow</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-hover)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>v1.0</span>
          </div>
          <div style={s.navBtns}>
            <button style={s.btnOutline} onClick={() => navigate('/login')} onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.target as HTMLElement).style.color = 'var(--text)'; }} onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}>Login</button>
            <button style={s.btnGrad} onClick={() => navigate('/signup')} onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'none'; }}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div>
          <h1 style={s.heroH1}>
            Goal Setting &{' '}
            <span style={s.heroGrad}>Performance Tracking</span>{' '}
            Made Simple
          </h1>
          <p style={s.heroP}>
            GoalFlow is the digital portal that eliminates goal-tracking chaos. Employees set
            aligned goals, managers approve and oversee, and HR gets audit-ready data — all in one beautiful platform.
          </p>
          <div style={s.heroCta}>
            <button style={s.heroBtn} onClick={() => navigate('/signup')} onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-3px)'; (e.target as HTMLElement).style.boxShadow = '0 12px 40px rgba(99,102,241,0.5)'; }} onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'none'; (e.target as HTMLElement).style.boxShadow = '0 8px 30px rgba(99,102,241,0.35)'; }}>
              Get Started Free →
            </button>
            <button style={s.heroBtnSec} onClick={() => navigate('/login')}>
              Try Demo ✨
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 36, maxWidth: 340 }}>
            {['No Credit Card Needed', 'Free Demo Data', '3 Demo Accounts', '2-Min Setup'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--success)' }}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
        <div style={s.heroVisual}>
          <div style={s.heroCard}>
            {/* Floating mini-cards inside visual */}
            <div style={{ position: 'absolute', top: 30, left: 30, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--success)' }}>85%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Revenue Goal</div>
            </div>
            <div style={{ position: 'absolute', top: 30, right: 30, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-hover)' }}>92%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Delivery Score</div>
            </div>
            <div style={{ position: 'absolute', bottom: 30, left: 30, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--warning)' }}>Q2 2026</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Active Cycle</div>
            </div>
            <div style={{ position: 'absolute', bottom: 30, right: 30, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--info)' }}>LOCKED</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Sheet Status</div>
            </div>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <img src="/logo.png" alt="GoalFlow" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16, boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Real-Time Dashboards</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8, maxWidth: 280 }}>
                Managers see team progress at a glance. Employees track goals throughout the year.
              </p>
            </div>
            {/* Gradient glow behind */}
            <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0 }} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map((st, i) => (
          <div key={i} style={s.statCard} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-glow)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, background: 'var(--gradient-2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{st.number}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>{st.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{st.sub}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>Powerful Features</h2>
          <p style={s.sectionSub}>Everything you need for end-to-end goal management</p>
          <div style={s.featGrid}>
            {features.map((f, i) => (
              <div key={i} onClick={() => setActiveFeature(i)} style={{ ...s.featCard, background: activeFeature === i ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))' : 'var(--bg-card)', borderColor: activeFeature === i ? 'rgba(99,102,241,0.4)' : 'var(--border)' }} onMouseEnter={e => { if (activeFeature !== i) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }} onMouseLeave={e => { if (activeFeature !== i) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ fontSize: '1.5rem', padding: '8px 12px', borderRadius: 12, background: activeFeature === i ? 'rgba(99,102,241,0.2)' : 'rgba(75,85,120,0.15)', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>{f.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 0' }}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>What Users Say</h2>
          <p style={s.sectionSub}>Real feedback from different user roles</p>
          <div style={s.testGrid}>
            {testimonials.map((t, i) => (
              <div key={i} style={s.testCard} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: '2rem' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.7 }}>"{t.quote}"</p>
                <div style={{ marginTop: 12, color: '#fbbf24', letterSpacing: 2 }}>★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>Frequently Asked Questions</h2>
          <p style={s.sectionSub}>Got questions? We've got answers.</p>
          <div style={s.faqList}>
            {faqItems.map((faq, i) => (
              <details key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 24px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {faq.q} <span style={{ color: 'var(--accent-hover)', fontSize: '0.8rem' }}>▼</span>
                </summary>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.7 }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '0 2rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>Ready to Transform Goal Management?</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: 16 }}>Join teams across organizations using GoalFlow for transparent, audit-ready goal tracking.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 36 }}>
            <button style={s.heroBtn} onClick={() => navigate('/signup')}>Create Free Account →</button>
            <button style={s.heroBtnSec} onClick={() => navigate('/login')}>Login Existing Account</button>
          </div>
          {/* Demo quick access */}
          <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>Or try with demo credentials:</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              {[
                { label: '👤 Employee', email: 'emp1@goalflow.demo', pw: 'Emp@123', color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' },
                { label: '👔 Manager', email: 'manager@goalflow.demo', pw: 'Manager@123', color: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)' },
                { label: '🔑 Admin', email: 'admin@goalflow.demo', pw: 'Admin@123', color: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
              ].map(d => (
                <button key={d.label} onClick={() => { localStorage.setItem('demoUser', JSON.stringify({ email: d.email, password: d.pw })); navigate('/login'); }} style={{ padding: '8px 20px', borderRadius: 10, background: d.color, border: `1px solid ${d.border}`, color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font)' }}>{d.label}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="GoalFlow" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GoalFlow</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            © 2026 GoalFlow. Built for <span style={{ color: 'var(--accent-hover)' }}>AtomQuest Hackathon 1.0</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
