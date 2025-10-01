import '../App.css';

// Reuse pillars definition (could extract to shared module later)
const pillars = [
  {
    title: 'Ethical Infrastructure',
    description: 'Scalable and replicable protocols for useful, transparent, accountable AI systems.'
  },
  {
    title: 'Participatory Data',
    description: 'Human-centered data practices rooted in informed, bounded consent and deliberative engagement (inspired by the Danish model) scaled to enable statistically significant, ethically grounded AI systems designed to benefit humanity.'
  },
  {
    title: 'Science- and Culture- informed Research',
    description: 'Responsible data practices and methodologies that maximize engagement for mutual benefit, with long-term individual and collective human safety at the root.'
  }
];

export default function LearnMore() {
  return (
    <div className="learn-page">
      <header className="hero hero--lean">
        <div className="hero__inner hero__inner--narrow">
          <h1>Learn More</h1>
          <p className="lede">Mission, vision, and the scaffolding we are building for collective intelligence.</p>
        </div>
      </header>
      <main className="learn-main">
        <section className="learn-block" aria-labelledby="mission-heading">
          <div className="learn-block__inner">
            <h2 id="mission-heading" className="learn-heading">Our mission</h2>
            <p className="learn-intro">Catalyzing beneficial artificial intelligence by ethically cultivating robust human data.</p>
            <div className="pillars pillars--centered">
              {pillars.map(p => (
                <article key={p.title} className="pillar pillar--elevated">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="learn-block learn-block--alt" aria-labelledby="vision-heading">
          <div className="learn-block__inner">
            <h2 id="vision-heading" className="learn-heading">Our vision</h2>
            <div className="learn-rich-text">
              <p>We see the development of artificial general intelligence (AGI) and the definition of consciousness not as separate frontiers, but as one shared quest.</p>
              <p>AGI is commonly understood as an intelligence capable of performing any cognitive task a human can, with the ability to learn, adapt, and generalize across domains. Consciousness, meanwhile, remains one of humanity’s most profound open questions — the lived experience of awareness, agency, and meaning.</p>
              <p>At HumanAI Convention, we believe these two challenges are inseparable. To build AGI responsibly, we must deepen our understanding of consciousness. To define consciousness rigorously, we must explore how intelligence emerges, adapts, and interacts with the world.</p>
              <p>Our vision is to create a participatory, open-source commons where researchers, communities, and everyday users can:</p>
              <ul className="vision-list vision-list--compact">
                <li>Model and explore consciousness through modular dashboards and wiki trees.</li>
                <li>Contribute to AGI development by testing, remixing, and refining theories in transparent, reproducible ways.</li>
                <li>Track the evolution of ideas across individuals and communities, building a living knowledge graph of mind and intelligence.</li>
                <li>Anchor progress in ethics and equity, ensuring that the path toward AGI is guided by collective wisdom and public benefit.</li>
              </ul>
              <p>We are not just observers of this quest — we are builders of the scaffolding that allows humanity to approach it together. By weaving rigorous science with playful, participatory design, HumanAI Convention will help transform the defining challenge of our century into a shared, navigable journey.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
