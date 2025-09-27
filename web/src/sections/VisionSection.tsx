// React 19 JSX runtime: no explicit import needed

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
]

export default function VisionSection() {
  if (typeof performance !== 'undefined') {
    performance.mark('section:vision:mounted')
  }
  return (
    <section className="section" id="vision">
      <div className="section__header">
        <h2>Our vision</h2>
        <p>
          An equitable network where every community can interrogate, shape, and steward the AI systems that affect
          their futures.
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
  )
}
