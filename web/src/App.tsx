import './App.css'

const pillars = [
  {
    title: 'Ethical Infrastructure',
    description:
      'Blueprints and reusable protocols for transparent, accountable AI systems rooted in human rights.',
  },
  {
    title: 'Participatory Governance',
    description:
      'Decision-making processes that center communities, especially those historically excluded from technology policy.',
  },
  {
    title: 'Trauma-Informed Research',
    description:
      'Responsible data practices and methodologies designed with long-term psychological safety in mind.',
  },
]

const roadmap = [
  {
    phase: 'Q4 2025',
    label: 'Foundational release',
    detail: 'Launch open reference architecture, governance playbooks, and the HumanAI Convention toolkit.',
  },
  {
    phase: '2026',
    label: 'Pilot collaborations',
    detail: 'Co-design pilots with Tribal Nations, rural collectives, and public-benefit alliances across three continents.',
  },
  {
    phase: '2027',
    label: 'Global convenings',
    detail: 'Facilitate annual assemblies and publish living standards for reproducible, human-centered AI governance.',
  },
]

const contactChannels = [
  {
    label: 'Join the conversation',
    href: 'https://github.com/humanaiconvention/humanaiconvention/discussions',
  },
  {
    label: 'Request a pilot partnership',
    href: 'mailto:partners@humanaiconvention.org',
  },
  {
    label: 'Subscribe for updates',
    href: 'https://humanaiconvention.org/subscribe',
  },
]

function App() {
  return (
    <div className="page">
      <header className="hero" id="top">
        <div className="hero__inner">
          <p className="eyebrow">HumanAI Convention</p>
          <h1>Shared governance for responsible, human-centered AI.</h1>
          <p className="lede">
            We are a public-benefit initiative crafting reproducible, trauma-informed frameworks that keep
            communities in control of intelligent systems.
          </p>
          <div className="hero__actions">
            <a className="cta" href="#vision">Explore the framework</a>
            <a className="cta cta--ghost" href={contactChannels[0].href} target="_blank" rel="noreferrer">
              Join the discussion
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="vision">
          <div className="section__header">
            <h2>Our vision</h2>
            <p>
              An equitable governance fabric where every community can interrogate, shape, and steward the AI systems
              that affect their futures.
            </p>
          </div>
          <div className="pillars">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="pillar">
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="roadmap">
          <div className="section__header">
            <h2>Roadmap</h2>
            <p>Milestones on our path to a shared, open standard for human-aligned intelligence.</p>
          </div>
          <ol className="roadmap">
            {roadmap.map((item) => (
              <li key={item.phase} className="roadmap__item">
                <div className="roadmap__phase">{item.phase}</div>
                <div className="roadmap__content">
                  <h3>{item.label}</h3>
                  <p>{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="participate">
          <div className="section__header">
            <h2>Participate</h2>
            <p>Bring your lived experience, legal insight, scientific rigor, or design practice to the table.</p>
          </div>
          <div className="channels">
            {contactChannels.map((channel) => (
              <a key={channel.label} className="channel" href={channel.href} target="_blank" rel="noreferrer">
                <span>{channel.label}</span>
                <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 5h9v9M15 5l-10 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__content">
          <p>© {new Date().getFullYear()} HumanAI Convention. Built for collective intelligence.</p>
          <a href="#top">Back to top</a>
        </div>
      </footer>
    </div>
  )
}

export default App
