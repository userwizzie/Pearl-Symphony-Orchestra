import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import AdminPortal from './AdminPortal.jsx'
import horizontalLogoImage from '../logo/Pearl Symphony Orchestra logo 2026_1-footer.png'
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft,
  ChevronRight, Headphones, Instagram, Linkedin, Mail, Menu, Music2,
  Play, Search, Send, Sparkles, X, Youtube,
} from 'lucide-react'

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/pearl_symphony_orchestra?vrfl=MTJoZzJ2N2QxdnFhcQ%3D%3D&utm_source=qr' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@pearl.symphony.orch?_r=1&_t=ZS-9AzLQje06o0' },
  { label: 'X', href: 'https://x.com/pearlsym4ny?s=11' },
]
const contactPhone = '256758510783'
const contactPhoneHref = `tel:+${contactPhone}`
const contactWhatsAppHref = `https://wa.me/${contactPhone}`
const donationNote = 'Support Pearl Symphony Orchestra (Cultural Music & Fusion Ensemble)'

async function submitPublicInquiry(data) {
  const response = await fetch('/api/public/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || result.message || 'We could not submit your enquiry. Please try again.')
  return result
}

function usePublishedRecords(collection) {
  const [records, setRecords] = useState(null)
  useEffect(() => {
    let active = true
    fetch(`/api/public/content/${collection}`)
      .then(async (response) => {
        if (!response.ok) return null
        const payload = await response.json()
        return payload.records || payload.items || []
      })
      .then((items) => {
        if (active && Array.isArray(items) && items.length) setRecords(items.map((item) => item.data || item))
      })
      .catch(() => {})
    return () => { active = false }
  }, [collection])
  return records
}

function publicAssetUrl(value) {
  if (!value) return ''
  return /^(https?:)?\/\//i.test(value) || value.startsWith('/') ? value : `/${value}`
}

function publicHttpUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function packageEmbedUrl(value) {
  const safeUrl = publicHttpUrl(value)
  if (!safeUrl) return ''
  const url = new URL(safeUrl)
  if (['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    const videoId = url.searchParams.get('v') || url.pathname.match(/^\/embed\/([A-Za-z0-9_-]+)/)?.[1]
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : ''
  }
  if (url.hostname === 'youtu.be') {
    const videoId = url.pathname.slice(1).split('/')[0]
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : ''
  }
  if (url.hostname === 'player.vimeo.com' && /^\/video\/\d+/.test(url.pathname)) return url.href
  return ''
}

const musicians = [
  { name: 'The Afro Violinist', role: 'Founder & Orchestra Director', section: 'Leadership', image: 'Afro Nuel .jpg.jpeg', bio: 'Multi-instrumentalist, composer and arranger bringing a distinct Ugandan voice to the orchestra.', focus: 'Violin · composition · arrangement', socials: { X: 'https://x.com/afro_violinist?s=11', Instagram: 'https://www.instagram.com/the_afro_violinist?rpxt=MTBjZTE1c2tyNGcwOA%3D%3D&utm_source=qr', TikTok: 'https://www.tiktok.com/@theafroviolinist?_r=1&_t=ZS-9AzN91Gg0iS' }, catalogLinks: [{ label: 'Spotify', href: 'https://open.spotify.com/artist/4t9I2gyRQQDa52tB8LoI2a?si=jtJigN4vRIuHXcfcgPIBgg&utm_source=copy-link', icon: Headphones }, { label: 'Apple Music', href: 'https://music.apple.com/album/a/1789495884?app=music&itscg=10002&itsct=mus_1715940631&ct=QTnxmRy0XaqmKTA&at=1010l367Y&ls=1', icon: Music2 }, { label: 'YouTube', href: 'https://youtube.com/@theafroviolinist2043?si=RhBGxo4ZitsVE5wI', icon: Youtube }] },
  { name: 'Mr. Mubiru David Noah', role: 'Music Director & Conductor', section: 'Leadership', image: 'IMG_0408.PNG', bio: 'Guides a versatile ensemble through orchestral arrangements shaped by homegrown sound.', focus: 'Conducting · orchestral direction', socials: { YouTube: 'https://youtube.com/@mubirudavidnoah6069?si=iXFua_7ngZWoZx7s', Instagram: 'https://www.instagram.com/davidnmubiru?dlrf=MWwzZ2Y0N282NHB5Mw%3D%3D&utm_source=qr', TikTok: 'https://www.tiktok.com/@davidnoahmubiru', Email: 'mailto:mubirudavidnoah@gmail.com', LinkedIn: 'https://ug.linkedin.com/in/david-noah-mubiru-4a10b51a9' } },
  { name: 'Orchestra Management', role: 'Management & production', section: 'Leadership', image: null, bio: 'Coordinates the people, partnerships and production behind every Pearl performance.', focus: 'Artist coordination · production' },
  { name: 'Section Leaders', role: 'Strings, winds & traditional', section: 'Leadership', image: null, bio: 'Connects the orchestra’s individual sections into one expressive ensemble.', focus: 'Ensemble development · section coordination' },
  { name: 'Strings Ensemble', role: 'Violin, viola & cello', section: 'Strings', image: null, bio: 'A lyrical string section moving between classical precision and East African melodic traditions.', focus: 'Classical strings · Ugandan arrangements' },
  { name: 'Ssemaganda Joel Saava', role: 'Cellist', section: 'Strings', image: 'WhatsApp Image 2026-11-02 at 12.50.27.jpeg', bio: 'I am a passionate cellist who began my musical journey in 2017. Since then, I have continued to develop my skills and grow as a musician through dedication, discipline, and commitment to excellence. I have successfully completed several ABRSM examinations, achieving distinctions in all my exams. Throughout my musical journey, I have also had the opportunity to perform with different orchestras, gaining valuable experience, developing my orchestral skills, and sharing my passion for music with others. My journey as a cellist continues to inspire me to grow, learn, and pursue greater musical achievements.', focus: 'Cello · orchestral strings', socials: { Instagram: 'https://www.instagram.com/joelsemasaava?srtk=cjhrNHI5Nmh3bWxp&utm_source=qr' } },
  { name: 'Larry Guitar', role: 'Guitarist, Producer & Composer', section: 'Strings', image: 'Larry guitar.jpeg', bio: 'Multi-instrumentalist, producer, composer and audio mixing engineer associated with Ugandan music and Emotion instrumental pieces.', focus: 'Guitar · production · composition · audio mixing', socials: { YouTube: 'https://youtube.com/@larryguitarug7864?si=kcxgH5TKWWwWCCch', TikTok: 'https://www.tiktok.com/@larryguitaroffical0', Instagram: 'https://www.instagram.com/uglarryguitar?obrf=MTR1emF4cnVzN2xvaw%3D%3D&utm_source=qr' } },
  { name: 'Woodwind Ensemble', role: 'Flute, clarinet & saxophone', section: 'Woodwinds', image: null, bio: 'A colorful wind section adding breath, movement and detail to every arrangement.', focus: 'Woodwinds · contemporary arrangements' },
  { name: 'Brass Ensemble', role: 'Trumpet, trombone & horn', section: 'Brass', image: null, bio: 'A bright, confident brass sound built for concert halls, celebrations and open-air stages.', focus: 'Brass · orchestral repertoire' },
  { name: 'Traditional Ensemble', role: 'Adungu, amadinda & more', section: 'Traditional African', image: null, bio: 'Traditional instruments at the heart of a contemporary, unmistakably Ugandan orchestral sound.', focus: 'Adungu · amadinda · indigenous repertoire' },
  { name: 'Percussion Ensemble', role: 'Engoma & orchestral percussion', section: 'Percussion', image: null, bio: 'Rhythmic foundations connecting Ugandan percussion traditions with the pulse of a modern orchestra.', focus: 'Engoma · orchestral percussion' },
]

const tracks = [
  { title: 'The First Days', kind: 'A Pearl Symphony original', category: 'Signature Renditions', year: '2025', image: 'Afro Grad.JPG.jpeg' },
  { title: 'Ugandan Anthem', kind: 'Orchestral rendition', category: 'Anthems', year: '2026', image: 'AfroUg3.PNG' },
  { title: 'A New Day', kind: 'Gospel arrangement', category: 'Gospel', year: '2026', image: 'WhatsApp Image 2026-11-02 at 12.42.30.jpeg' },
  { title: 'African Folk Medley', kind: 'Traditional arrangement', category: 'African Folk Arrangements', year: '2026', image: 'AfroUg2.JPG.jpeg' },
]

const streamingLinks = [
  { label: 'Spotify', href: 'https://open.spotify.com/search/Pearl%20Symphony%20Orchestra', icon: Headphones },
  { label: 'Apple Music', href: 'https://music.apple.com/search?term=Pearl%20Symphony%20Orchestra', icon: Music2 },
  { label: 'YouTube Music', href: 'https://music.youtube.com/search?q=Pearl+Symphony+Orchestra+Uganda', icon: Youtube },
]

const gallery = [
  { src: 'AfroUg3.PNG', alt: 'A Pearl Symphony Orchestra musician with his cello' },
  { src: 'Afro Nuel .jpg.jpeg', alt: 'The Afro Violinist with his violin' },
  { src: 'Afro Grad.JPG.jpeg', alt: 'The Afro Violinist performing live' },
  { src: 'WhatsApp Image 2026-11-02 at 12.42.30.jpeg', alt: 'A Pearl Symphony Orchestra musician' },
  { src: 'WhatsApp Image 2026-11-02 at 12.50.27.jpeg', alt: 'Pearl Symphony Orchestra cellist Ssemaganda Joel Saava' },
  { src: 'AfroUg3.PNG', alt: 'The Afro Violinist performing live' },
  { src: 'AfroUg2.JPG.jpeg', alt: 'The Afro Violinist performing with his violin' },
  { src: 'Afro Grad.JPG.jpeg', alt: 'The Afro Violinist performing with the orchestra' },
]

const events = [
  { state: 'PAST PERFORMANCE', date: '24 / 10 / 26', title: 'The Afrigo Band Orchestra Experience', venue: 'UMA Multipurpose Exhibition Hall', tag: 'Artist collaboration', image: 'Afro Grad.JPG.jpeg' },
  { state: 'AVAILABLE FOR BOOKINGS', date: 'BY ARRANGEMENT', title: 'A new sound, played together', venue: 'Kampala, Uganda and beyond', tag: 'Live performance', image: 'AfroUg2.JPG.jpeg' },
]

const filters = ['All', 'Leadership', 'Strings', 'Woodwinds', 'Brass', 'Traditional African', 'Percussion']
const navItems = [['Home', '/'], ['About', '/about'], ['Leadership', '/leadership'], ['Musicians', '/musicians'], ['Music', '/music'], ['Media', '/media'], ['Events', '/events'], ['Packages', '/packages'], ['Contact', '/contact']]

function SectionHeading({ eyebrow, title, copy, light = false }) {
  return (
    <div className={`section-heading${light ? ' section-heading--light' : ''}`}>
      <span className="eyebrow"><span />{eyebrow}</span>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  )
}

function DonationSection() {
  return (
    <section className="donation-section">
      <div className="page-width donation-panel">
        <div><span className="eyebrow"><span />KEEP THE MUSIC MOVING</span><h2>Support the sound.<br />Share in the journey.</h2><p>{donationNote}. Your support helps us create, perform and share Uganda's orchestral sound.</p></div>
        <DonateButton className="donation-cta" />
      </div>
    </section>
  )
}

function Logo({ placement = 'header' }) {
  const isFooter = placement === 'footer'
  return (
    <Link className={`brand${isFooter ? ' brand--inverse brand--footer' : ' brand--main'}`} to="/" aria-label="Pearl Symphony Orchestra home">
      <img className={`logo-mark ${isFooter ? 'footer-logo' : 'nav-logo'}`} src={horizontalLogoImage} alt="" />
    </Link>
  )
}

function DonateButton({ className = '' }) {
  return <a className={`button button--donate ${className}`.trim()} href={contactWhatsAppHref} target="_blank" rel="noopener noreferrer" title={donationNote} aria-label={`Donate via WhatsApp. ${donationNote}`}>Donate <ArrowUpRight size={15} /></a>
}

function WellWisherCard({ compact = false }) {
  return (
    <aside className={`well-wisher-card${compact ? ' well-wisher-card--compact' : ''}`}>
      <div><span className="eyebrow"><span />WELL WISHERS & SUPPORT</span><p>{donationNote}. Your support helps us create, perform and share Uganda's orchestral sound.</p></div>
      <a className="button button--donate" href={contactWhatsAppHref} target="_blank" rel="noopener noreferrer">Become a Well Wisher <ArrowUpRight size={15} /></a>
    </aside>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  return (
    <header className="header">
      <div className="support-bar">
        <span>Support Pearl Symphony Orchestra — Become a Well Wisher</span>
        <a href={contactWhatsAppHref} target="_blank" rel="noopener noreferrer">Become a Well Wisher <ArrowUpRight size={13} /></a>
      </div>
      <div className="header-inner">
        <Logo />
        <button className="icon-button menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
        <nav className={`nav${open ? ' nav--open' : ''}`} aria-label="Main navigation">
          <div className="mobile-nav-heading"><span>EXPLORE THE PEARL</span><button className="mobile-nav-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={21} /></button></div>
          {navItems.map(([label, href]) => <NavLink key={label} to={href} end={href === '/'} onClick={() => setOpen(false)}>{label}<ArrowUpRight className="nav-link-arrow" size={15} /></NavLink>)}
          <Link className="button button--green nav-book" to="/book-us" onClick={() => setOpen(false)}>Book The Orchestra <ArrowUpRight size={15} /></Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="home">
      <img className="hero-image" src="/SON_4522.JPG.jpeg" alt="Pearl Symphony Orchestra performing together" />
      <div className="hero-shade" />
      <div className="hero-content page-width">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="live-dot" /> A NEW SOUND, ROOTED HERE</span>
          <h1>Ugandan Sound.<br /><span>Orchestral Excellence.</span></h1>
          <p>Pearl Symphony Orchestra transforms familiar Ugandan, African and international sounds into powerful live orchestral experiences through performance, arrangement, collaboration and recorded music.</p>
          <div className="hero-actions">
            <Link className="button button--green" to="/book-us">Book The Orchestra <ArrowRight size={17} /></Link>
            <Link className="hero-watch" to="/music"><span className="play-ring"><Play size={14} fill="currentColor" /></span> Watch & Listen</Link>
          </div>
        </div>
        <div className="hero-caption"><span>01 / 04</span><i /><span>THE PEARL SOUND</span><Link to="/about" aria-label="Explore the orchestra"><ArrowDown size={17} /></Link></div>
      </div>
      <div className="hero-stamp"><Sparkles size={16} /><span>ROOTED IN UGANDA<br />MADE TO MOVE YOU</span></div>
    </section>
  )
}

function About() {
  const instruments = ['Adungu', 'Amadinda', 'Engoma', 'Endingidi', 'Akogo', 'Entongoli']
  return (
    <section className="about section-pad" id="about">
      <div className="page-width">
        <div className="about-grid">
          <div className="about-visual">
            <img src="/Afro Grad.JPG.jpeg" alt="The Afro Violinist performing with the orchestra" />
            <div className="about-visual-label"><span>OUR SOUND, OUR STORY</span><Music2 size={17} /></div>
            <div className="about-counter"><strong>01</strong><span>sound.<br />without borders.</span></div>
          </div>
          <div className="about-copy">
            <SectionHeading eyebrow="A DIFFERENT KIND OF ORCHESTRA" title={<>Many roots.<br />One unmistakable sound.</>} copy="We bring the sounds we grew up with into a bigger conversation." />
            <p className="body-copy">Pearl Symphony Orchestra is Uganda's foremost fusion ensemble. We bring indigenous instruments together with classical strings, woodwinds and brass, creating performances that feel both instantly familiar and entirely new.</p>
            <p className="body-copy">From intimate collaborations to a full ensemble of 20–50 artists, we shape the orchestra around the room, the occasion and the story you want to tell.</p>
            <div className="instrument-list"><span>IN THE MIX</span>{instruments.map((instrument) => <span className="instrument-chip" key={instrument}>{instrument}</span>)}</div>
            <Link className="text-link" to="/leadership">Meet the people behind the sound <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="mission-strip">
          <div><span className="eyebrow"><span />OUR MISSION</span><p>To create meaningful musical experiences through performance, arrangement and collaboration.</p></div>
          <div><span className="eyebrow"><span />OUR VISION</span><p>A Ugandan orchestral sound that travels, resonates and makes room for everyone.</p></div>
          <div className="mission-number"><strong>20<span>–</span>50</strong><span>artists, scaled to your stage</span></div>
        </div>
      </div>
    </section>
  )
}

function People({ leadershipOnly = false }) {
  const [filter, setFilter] = useState(leadershipOnly ? 'Leadership' : 'All')
  const [query, setQuery] = useState('')
  const managedPeople = usePublishedRecords('musicians')
  const roster = managedPeople?.map((person) => {
    const socialLines = typeof person.socialLinks === 'string' ? person.socialLinks.split(/\r?\n/).map((href) => href.trim()).filter(Boolean) : []
    const socials = Object.fromEntries(socialLines.map((href, index) => {
      const domain = href.toLowerCase()
      const label = domain.includes('instagram') ? 'Instagram' : domain.includes('youtube') ? 'YouTube' : domain.includes('tiktok') ? 'TikTok' : domain.includes('linkedin') ? 'LinkedIn' : domain.includes('mailto:') ? 'Email' : `Link ${index + 1}`
      return [label, href]
    }))
    const section = person.section === 'Traditional Fusion' ? 'Traditional African' : person.section
    return { ...person, role: person.role || person.instrument || '', section: section || 'Leadership', image: person.headshotUrl || person.image || '', socials: Object.keys(socials).length ? socials : person.socials, focus: person.focus || person.role || person.instrument || 'Orchestra musician' }
  }) || musicians
  const availableFilters = leadershipOnly ? ['Leadership'] : filters
  const visible = roster.filter((person) => {
    const matchesSection = leadershipOnly || filter === 'All' || person.section === filter
    const term = query.trim().toLowerCase()
    return matchesSection && (!term || `${person.name} ${person.role} ${person.section} ${person.bio}`.toLowerCase().includes(term))
  })
  return (
    <section className="people section-pad" id="people">
      <div className="page-width">
        <div className="section-topline"><SectionHeading eyebrow={leadershipOnly ? 'LEADERSHIP & ARTISTRY' : 'THE PEOPLE OF PEARL'} title={leadershipOnly ? <>The people<br />shaping our sound.</> : <>One ensemble.<br />Many voices.</>} copy={leadershipOnly ? 'Artistic vision, musical direction and the people bringing each performance together.' : 'Search the orchestra and explore the musicians, arrangers and leaders making room for a new sound.'} /><Link className="text-link desktop-link" to="/contact">Meet us in person <ArrowRight size={16} /></Link></div>
        {!leadershipOnly && <label className="roster-search"><Search size={16} /><span className="sr-only">Search musicians</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, roles or instruments" /></label>}
        {!leadershipOnly && <div className="filter-row" role="group" aria-label="Filter musicians by section">{availableFilters.map((item) => <button key={item} className={`filter-chip${filter === item ? ' is-active' : ''}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div>}
        <div className="people-grid">{visible.map((person) => <article className="person-card" key={person.name}>
          <div className={`person-image${person.image ? '' : ' person-image--placeholder'}`}>{person.image ? <img src={publicAssetUrl(person.image)} alt={`${person.name} in the Pearl Symphony Orchestra`} loading="lazy" /> : <div className="person-image-placeholder" aria-hidden="true"><Music2 size={30} /><span>Portrait coming soon</span></div>}<span className="person-index">{String(roster.indexOf(person) + 1).padStart(2, '0')}</span><span className="person-section">{person.section}</span></div>
          <div className="person-details"><div><h3>{person.name}</h3><span>{person.role}</span></div>          {person.socials && <div className="person-socials">{Object.entries(person.socials).map(([label, href]) => <a key={label} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'} aria-label={`${person.name} on ${label}`} title={label}>{label === 'Instagram' ? <Instagram size={15} /> : label === 'TikTok' ? <Music2 size={15} /> : label === 'YouTube' ? <Youtube size={15} /> : label === 'LinkedIn' ? <Linkedin size={15} /> : label === 'Email' ? <Mail size={15} /> : <span className="x-mark">𝕏</span>}</a>)}</div>}</div>
          <p className="person-bio">{person.bio}</p>{person.catalogLinks && <div className="person-catalog-links" aria-label={`${person.name} catalogue links`}><span>LISTEN</span>{person.catalogLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${person.name} on ${label}`}><Icon size={13} /><span>{label}</span></a>)}</div>}<div className="person-credit"><span>REPERTOIRE & FOCUS</span><strong>{person.focus}</strong></div>{leadershipOnly && <Link className="text-link leadership-contact" to="/contact">Connect with PSO <ArrowUpRight size={14} /></Link>}
        </article>)}</div>
        {visible.length === 0 && <p className="roster-empty">No musicians match that search. Try another name, role or section.</p>}
        {!leadershipOnly && <p className="roster-note">Section portraits are representative orchestra imagery. Artist roster grows with each performance.</p>}
      </div>
    </section>
  )
}

function Music() {
  const [category, setCategory] = useState('All releases')
  const publishedTracks = usePublishedRecords('music')
  const catalogue = publishedTracks?.map((track) => ({
    ...track,
    title: track.title || 'Untitled release',
    kind: track.description || track.kind || 'Pearl Symphony Orchestra release',
    category: track.category || 'Signature Renditions',
    year: track.releaseDate ? new Date(track.releaseDate).getFullYear() : track.year || '2026',
    image: track.artworkUrl || track.image || '',
  })) || tracks
  const categories = ['All releases', 'Signature Renditions', 'Anthems', 'Gospel', 'African Folk Arrangements']
  const filtered = category === 'All releases' ? catalogue : catalogue.filter((track) => track.category === category)
  const searchHref = 'https://www.youtube.com/results?search_query=Pearl+Symphony+Orchestra+Uganda'
  return (
    <section className="music-section section-pad" id="music">
      <div className="page-width">
        <div className="section-topline music-topline"><SectionHeading eyebrow="LISTEN CLOSELY" title={<>Music made<br />of many places.</>} copy="Original works and familiar melodies, reimagined by the Pearl." /><div className="music-platforms"><span>FIND US ON</span>{streamingLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={15} /> {label}</a>)}</div></div>
        <div className="music-controls"><div className="filter-row filter-row--music" role="group" aria-label="Filter music by category">{categories.map((item) => <button key={item} className={`filter-chip${category === item ? ' is-active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="release-count">{String(filtered.length).padStart(2, '0')} RELEASES</span></div>
        <div className="track-list">{filtered.map((track, index) => <article className="track-row" key={track.title}>
          <span className="track-number">0{index + 1}</span>
          {track.image ? <img className="track-art" src={publicAssetUrl(track.image)} alt="" loading="lazy" /> : <div className="track-art track-art--placeholder"><Music2 size={24} /></div>}
          <a className="track-play" href={publicHttpUrl(track.youtubeUrl) || `https://www.youtube.com/results?search_query=${encodeURIComponent(`Pearl Symphony Orchestra ${track.title}`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Find ${track.title} on YouTube`}><Play size={17} fill="currentColor" /></a>
          <div className="track-title"><h3>{track.title}</h3><span>{track.kind}</span>{publicHttpUrl(track.appleMusicUrl) && <a className="track-apple-link" href={publicHttpUrl(track.appleMusicUrl)} target="_blank" rel="noopener noreferrer">Listen on Apple Music <ArrowUpRight size={12} /></a>}</div>
          <span className="track-category">{track.category}</span><span className="track-year">{track.year}</span>
          <a className="track-link" href={publicHttpUrl(track.spotifyUrl) || `https://open.spotify.com/search/${encodeURIComponent(`Pearl Symphony Orchestra ${track.title}`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Find ${track.title} on Spotify`}><ArrowUpRight size={18} /></a>
        </article>)}</div>
        <div className="music-bottom"><span><Music2 size={15} /> NEW ARRANGEMENTS, ALWAYS IN THE WORKS</span><a className="text-link" href={searchHref} target="_blank" rel="noreferrer">Explore the full catalogue <ArrowRight size={16} /></a></div>
      </div>
    </section>
  )
}

function Media() {
  const [selected, setSelected] = useState(null)
  const managedMedia = usePublishedRecords('media')
  const photos = managedMedia?.filter((item) => ['Photo', 'EPK asset'].includes(item.type) && (item.mediaUrl || item.thumbnailUrl)).map((item) => ({ src: item.thumbnailUrl || item.mediaUrl, alt: item.title || 'Pearl Symphony Orchestra media' })) || gallery
  const videos = managedMedia?.filter((item) => item.type === 'Video' && publicHttpUrl(item.mediaUrl)) || []
  const changeImage = (direction) => setSelected((current) => (current + direction + photos.length) % photos.length)
  return (
    <section className="media section-pad" id="media">
      <div className="page-width">
        <div className="section-topline"><SectionHeading eyebrow="SEEN & HEARD" title={<>A little of the<br />Pearl, in motion.</>} copy="On stage, behind the scenes and everywhere music takes us." /><a className="text-link desktop-link" href="https://www.youtube.com/results?search_query=Pearl+Symphony+Orchestra+Uganda" target="_blank" rel="noreferrer">Watch our latest <ArrowUpRight size={16} /></a></div>
        <div className="media-grid"><a className="media-feature" href="https://www.youtube.com/results?search_query=Pearl+Symphony+Orchestra+Uganda" target="_blank" rel="noreferrer"><img src="/SON_4522.JPG.jpeg" alt="A Pearl Symphony Orchestra performance" loading="lazy" /><span className="media-feature-overlay"><span className="play-ring play-ring--large"><Play size={18} fill="currentColor" /></span><span><small>LIVE PERFORMANCE</small><strong>The sound of Pearl, live.</strong></span><ArrowUpRight size={19} /></span></a>
          <div className="media-photo-grid">{photos.map((photo, index) => <button className="photo-tile" key={`${photo.src}-${index}`} onClick={() => setSelected(index)} aria-label={`Open photo: ${photo.alt}`}><img src={publicAssetUrl(photo.src)} alt={photo.alt} loading="lazy" /><span className="photo-zoom"><ArrowUpRight size={17} /></span></button>)}</div>
        </div>
        {videos.length > 0 && <div className="media-video-grid" aria-label="Published performance videos">{videos.map((video) => <a key={video.id || video.title} href={publicHttpUrl(video.mediaUrl)} target="_blank" rel="noopener noreferrer"><span className="media-video-image">{video.thumbnailUrl && <img src={publicAssetUrl(video.thumbnailUrl)} alt="" loading="lazy" />}<span className="play-ring"><Play size={15} fill="currentColor" /></span></span><span><small>VIDEO</small><strong>{video.title}</strong>{video.description && <span>{video.description}</span>}</span><ArrowUpRight size={17} /></a>)}</div>}
        <div className="social-ribbon"><div><span className="eyebrow"><span />FOLLOW THE SOUND</span><p>More moments from the people of Pearl.</p></div><div className="social-ribbon-links">{socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label} <ArrowUpRight size={14} /></a>)}</div></div>
      </div>
      {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={() => setSelected(null)} onKeyDown={(event) => { if (event.key === 'Escape') setSelected(null); if (event.key === 'ArrowRight') changeImage(1); if (event.key === 'ArrowLeft') changeImage(-1) }} tabIndex={-1} ref={(node) => node?.focus()}><button className="lightbox-close icon-button" onClick={() => setSelected(null)} aria-label="Close gallery"><X /></button><button className="lightbox-arrow lightbox-arrow--left icon-button" onClick={(event) => { event.stopPropagation(); changeImage(-1) }} aria-label="Previous photo"><ChevronLeft /></button><figure onClick={(event) => event.stopPropagation()}><img src={publicAssetUrl(photos[selected].src)} alt={photos[selected].alt} /><figcaption>{photos[selected].alt} <span>{String(selected + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span></figcaption></figure><button className="lightbox-arrow lightbox-arrow--right icon-button" onClick={(event) => { event.stopPropagation(); changeImage(1) }} aria-label="Next photo"><ChevronRight /></button></div>}
    </section>
  )
}

function Events() {
  const managedEvents = usePublishedRecords('events')
  const schedule = managedEvents?.map((event) => ({
    ...event,
    state: event.status || event.state || 'UPCOMING',
    date: event.dateTime ? new Date(event.dateTime).toLocaleDateString() : event.date || 'DATE TO BE ANNOUNCED',
    title: event.eventName || event.title || 'Orchestra performance',
    venue: event.venue || 'Venue to be announced',
    tag: event.tag || 'Live performance',
    image: event.bannerImage || event.image || '',
  })) || events
  return (
    <section className="events section-pad" id="events"><div className="page-width">
      <div className="section-topline events-heading"><SectionHeading eyebrow="WHERE WE MEET" title={<>Good music.<br />Good company.</>} copy="A featured collaboration and room for the next one to come." /><Link className="button button--outline" to="/book-us">Make something happen <ArrowUpRight size={16} /></Link></div>
      <div className="event-grid">{schedule.map((event, index) => <article className={`event-card${index === 0 ? ' event-card--featured' : ''}`} key={event.id || event.title}><div className="event-card-art">{event.image && <img src={publicAssetUrl(event.image)} alt="" loading="lazy" />}<span className="event-status">{event.state}</span><span className="event-date">{event.date}</span></div><div className="event-card-copy"><span className="event-type">{event.tag}</span><h3>{event.title}</h3><p><span className="event-pin">●</span>{event.venue}</p>{event.ticketUrl && <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" aria-label={`Get tickets for ${event.title}`}><ArrowUpRight size={18} /></a>}{!event.ticketUrl && <Link to="/book-us" aria-label={`Enquire about ${event.title}`}><ArrowUpRight size={18} /></Link>}</div></article>)}</div>
      <div className="service-row"><span className="eyebrow"><span />BUILT FOR YOUR MOMENT</span><div className="service-list">{['Concerts', 'Corporate', 'Weddings', 'Church & gospel', 'Artist collaborations', 'Media & themes'].map((service) => <span key={service}>{service}<ArrowRight size={13} /></span>)}</div></div>
    </div></section>
  )
}

function Booking() {
  const [submitted, setSubmitted] = useState(false)
  const [bookingStep, setBookingStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const advanceBooking = (event) => {
    const currentStep = event.currentTarget.form.querySelector(`[data-booking-step="${bookingStep}"]`)
    if (currentStep && [...currentStep.querySelectorAll('input, select, textarea')].every((field) => field.reportValidity())) {
      setBookingStep((step) => Math.min(step + 1, 2))
    }
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const formData = Object.fromEntries(new FormData(form).entries())
    setSubmitting(true)
    setSubmitError('')
    try {
      await submitPublicInquiry({ ...formData, name: formData.contact || formData.organisation, topic: formData.eventType || 'Booking enquiry', message: formData.description || `Booking enquiry for ${formData.date || 'a date to be confirmed'} at ${formData.venue || 'a venue to be confirmed'}.` })
      setSubmitted(true)
      form.reset()
      setBookingStep(0)
    } catch (error) {
      setSubmitError(error.message || 'We could not submit your enquiry. Please try again or contact us directly.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <section className="booking section-pad" id="book"><div className="page-width booking-grid">
      <div className="booking-copy"><SectionHeading eyebrow="LET'S MAKE IT SING" title={<>Tell us about<br />your occasion.</>} copy="Share a few details and we'll help shape the right ensemble for your event." light />
        <div className="booking-promise"><span><Check size={16} /> Tailored to your occasion</span><span><Check size={16} /> Scalable ensemble, 20–50 artists</span><span><Check size={16} /> Kampala-based, ready to travel</span></div>
        <a className="booking-email" href={contactPhoneHref}>Questions? Call +{contactPhone} <ArrowUpRight size={15} /></a>
        <div className="booking-decoration" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
      </div>
      <div className="booking-form-wrap">{submitted ? <div className="form-success" role="status"><span className="success-check"><Check size={25} /></span><span className="eyebrow"><span />ENQUIRY RECEIVED</span><h3>Let's make something memorable.</h3><p>Your booking enquiry has been sent to the Pearl Symphony Orchestra team. We will be in touch soon.</p><button className="text-link form-reset" onClick={() => setSubmitted(false)}>Start another enquiry <ArrowRight size={15} /></button></div> : <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-intro"><span>BOOK THE ORCHESTRA</span><small>* REQUIRED FIELDS</small></div>
          <div className="booking-progress" aria-label={`Step ${bookingStep + 1} of 3`}><div className="booking-progress-bar"><span style={{ width: `${((bookingStep + 1) / 3) * 100}%` }} /></div><span>STEP {bookingStep + 1} OF 3</span></div>
          <div className="booking-step" data-booking-step="0" hidden={bookingStep !== 0}><span className="booking-step-title">First, who are we speaking with?</span><div className="form-grid">
            <label>Client / organisation name *<input name="organisation" required autoComplete="organization" placeholder="Your organisation" /></label>
            <label>Contact person *<input name="contact" required autoComplete="name" placeholder="Full name" /></label>
            <label>Email address *<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
            <label>Phone number *<input name="phone" type="tel" required autoComplete="tel" placeholder="+256 7XX XXX XXX" /></label>
            <label>WhatsApp number<input name="whatsapp" type="tel" placeholder="If different from your phone" /></label>
          </div></div>
          <div className="booking-step" data-booking-step="1" hidden={bookingStep !== 1}><span className="booking-step-title">Tell us about the occasion.</span><div className="form-grid">
            <label>Event type *<span className="select-wrap"><select name="eventType" required defaultValue=""><option value="" disabled>Select an occasion</option>{['Concert', 'Corporate event', 'Wedding or private event', 'Church or gospel', 'Artist collaboration', 'Media or theme', 'Other'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></span></label>
            <label>Event date *<input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} /></label>
            <label>Venue & location *<input name="venue" required placeholder="Venue, town or city" /></label>
            <label>Expected audience<select name="audience" defaultValue=""><option value="" disabled>Select an estimate</option><option>Under 100</option><option>100–300</option><option>300–1,000</option><option>1,000+</option></select></label>
            <label>Requested orchestra size<select name="ensembleSize" defaultValue=""><option value="" disabled>Let's discuss</option><option>20–25 musicians</option><option>26–35 musicians</option><option>36–50 musicians</option><option>Recommend a size</option></select></label>
            <label>Performance start<input name="startTime" type="time" /></label>
            <label>Performance end<input name="endTime" type="time" /></label>
          </div></div>
          <div className="booking-step" data-booking-step="2" hidden={bookingStep !== 2}><span className="booking-step-title">Let’s shape the right ensemble.</span><div className="form-grid">
            <label>Package preference<select name="package" defaultValue=""><option value="" disabled>Choose or discuss</option><option>Concert ensemble</option><option>Corporate experience</option><option>Wedding or private event</option><option>Church & gospel</option><option>Artist collaboration</option><option>Custom arrangement</option></select></label>
            <label>Budget range<select name="budget" defaultValue=""><option value="" disabled>Optional</option><option>Under UGX 5 million</option><option>UGX 5–15 million</option><option>UGX 15–30 million</option><option>UGX 30 million+</option><option>To be discussed</option></select></label>
            <label className="form-full">Event description<textarea name="description" rows="3" placeholder="Tell us about the occasion and atmosphere you have in mind." /></label>
            <label className="form-full">Technical & sound requirements<textarea name="technicalRequirements" rows="2" placeholder="Stage, amplification, instruments, or other production requirements." /></label>
          </div></div>
          {submitError && <p className="form-submit-error" role="alert">{submitError}</p>}<div className="booking-step-actions">{bookingStep > 0 && <button className="button button--outline" type="button" onClick={() => setBookingStep((step) => step - 1)}>Back</button>}{bookingStep < 2 ? <button className="button button--green" type="button" onClick={advanceBooking}>Continue <ArrowRight size={17} /></button> : <button className="button button--green form-submit" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send your enquiry'} <ArrowRight size={17} /></button>}</div><span className="form-privacy">No commitment. Just the start of a conversation.</span>
        </form>}</div>
    </div></section>
  )
}

function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const handleSubscribe = (event) => { event.preventDefault(); if (event.currentTarget.reportValidity()) { setSubscribed(true); setEmail('') } }
  const footerSocials = [
    { label: 'Instagram', href: socialLinks[0].href, icon: Instagram },
    { label: 'YouTube search', href: 'https://www.youtube.com/results?search_query=Pearl+Symphony+Orchestra+Uganda', icon: Youtube },
    { label: 'Spotify search', href: streamingLinks[0].href, icon: Headphones },
    { label: 'TikTok', href: socialLinks[1].href, icon: Music2 },
    { label: 'X', href: socialLinks[2].href, mark: '𝕏' },
    { label: 'Facebook', mark: 'f', disabled: true },
  ]
  const quickLinks = navItems.filter(([label]) => label !== 'Book Us' && label !== 'Contact')
  return (
    <footer className="footer footer--modern" id="contact"><div className="footer-shell">
      <div className="footer-main footer-grid">
        <div className="footer-brand-col footer-column"><Logo placement="footer" /><p className="footer-tagline">Ugandan Sound. Orchestral Excellence.</p><p className="footer-brand-copy">Traditional African instruments — Adungu, Amadinda and Engoma — meet world-class orchestral performance.</p><a className="footer-contact" href={contactPhoneHref}>Call +{contactPhone} <ArrowUpRight size={14} /></a></div>
        <nav className="footer-links footer-column" aria-label="Footer navigation"><h2 className="footer-heading">Explore</h2>{quickLinks.map(([label, href]) => <Link key={label} to={href}>{label === 'Music' ? 'Music Catalogue' : label === 'Media' ? 'Media Gallery' : label === 'Packages' ? 'Our Packages' : label}</Link>)}</nav>
        <div className="footer-booking footer-column"><h2 className="footer-heading">Bookings & Support</h2><p>Bring the Pearl sound to your next occasion.</p><Link className="button button--green footer-book-button" to="/book-us">Book The Orchestra <ArrowUpRight size={16} /></Link><WellWisherCard compact /></div>
        <div className="newsletter footer-column"><h2 className="footer-heading">Stay in the Loop</h2><p>Stay updated on upcoming concerts & releases.</p>{subscribed ? <span className="newsletter-success" role="status"><Check size={15} /> Signup received (demo only).</span> : <form className="newsletter-form" onSubmit={handleSubscribe}><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required /><button type="submit" aria-label="Subscribe to the newsletter"><ArrowRight size={17} /></button></form>}<small>NEWSLETTER SIGN-UP IS A FRONT-END DEMO.</small><div className="footer-socials" aria-label="Social and music links">{footerSocials.map(({ label, href, icon: Icon, mark, disabled }) => disabled ? <span key={label} className="footer-social-disabled" aria-disabled="true" aria-label={`${label} channel coming soon`} title={`${label} channel coming soon`}>{Icon ? <Icon size={17} /> : <span>{mark}</span>}</span> : <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — Pearl Symphony Orchestra`} title={label}>{Icon ? <Icon size={17} /> : <span>{mark}</span>}</a>)}</div></div>
      </div>
      <div className="footer-bottom footer-utility"><span>© 2026 Pearl Symphony Orchestra. All rights reserved.</span><div className="footer-legal"><span>Privacy Policy <small>Coming soon</small></span><i aria-hidden="true">|</i><span>Terms of Service <small>Coming soon</small></span><i aria-hidden="true">|</i><span>Admin CMS Portal <small>Coming soon</small></span></div></div>
    </div></footer>
  )
}

function PageIntro({ eyebrow, title, copy, image }) {
  const location = useLocation()
  const pageName = navItems.find(([, href]) => href === location.pathname)?.[0] ?? 'Page'
  return (
    <section className={`page-intro${image ? ' page-intro--image' : ''}`} style={image ? { '--page-image': `url("${image}")` } : undefined}>
      <div className="page-width">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span aria-current="page">{pageName}</span></nav>
        <span className="eyebrow"><span />{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </section>
  )
}

const homeStories = [
  { eyebrow: 'OUR STORY', title: 'Many roots. One sound.', image: 'Afro Grad.JPG.jpeg', href: '/about', copy: 'Traditional Ugandan instruments meet orchestral craft.' },
  { eyebrow: 'THE PEOPLE', title: 'Meet the makers.', image: 'Afro Nuel .jpg.jpeg', href: '/leadership', copy: 'Get to know the artists shaping the Pearl sound.' },
  { eyebrow: 'NEW MUSIC', title: 'Listen closer.', image: 'AfroUg2.JPG.jpeg', href: '/music', copy: 'Original works and familiar melodies, reimagined.' },
  { eyebrow: 'ON THE STAGE', title: 'A sound in motion.', image: 'SON_4522.JPG.jpeg', href: '/media', copy: 'Live performances and moments from behind the scenes.' },
]

function HomeHighlights() {
  return (
    <section className="home-highlights section-pad">
      <div className="page-width">
        <div className="section-topline"><SectionHeading eyebrow="EXPLORE THE PEARL" title={<>A new sound.<br />A world of stories.</>} copy="Meet the people, music and moments moving Uganda's orchestral sound forward." /><Link className="text-link desktop-link" to="/about">Discover the orchestra <ArrowRight size={16} /></Link></div>
        <div className="home-story-grid">
          {homeStories.map((story, index) => <Link className={`home-story-card home-story-card--${index + 1}`} to={story.href} key={story.eyebrow}>
            <img src={`/${story.image}`} alt="" loading="lazy" />
            <span className="home-story-shade" />
            <span className="home-story-copy"><small>{story.eyebrow}</small><strong>{story.title}</strong><span>{story.copy}</span></span>
            <span className="home-story-arrow"><ArrowUpRight size={18} /></span>
          </Link>)}
          <Link className="home-event-card" to="/events">
            <span className="eyebrow"><span />LIVE & IN GOOD COMPANY</span>
            <small>24 OCTOBER 2026 · UMA, KAMPALA</small>
            <strong>The Afrigo Band Orchestra Experience</strong>
            <span>Relive the collaboration <ArrowUpRight size={16} /></span>
          </Link>
          <Link className="home-release-card" to="/music">
            <img src="/Afro Grad.JPG.jpeg" alt="" loading="lazy" />
            <span className="home-release-copy"><small>FROM THE CATALOGUE</small><strong>The First Days</strong><span>Listen to the Pearl catalogue <ArrowUpRight size={15} /></span></span>
          </Link>
        </div>
        <div className="home-book-strip"><div><span className="eyebrow"><span />YOUR MOMENT, IN FULL SOUND</span><h2>Make room for something unforgettable.</h2></div><Link className="button button--green" to="/book-us">Book The Orchestra <ArrowRight size={17} /></Link></div>
      </div>
    </section>
  )
}

function ExplainerVideo() {
  return (
    <section className="explainer-section section-pad">
      <div className="page-width">
        <div className="explainer-heading">
          <SectionHeading eyebrow="MEET THE PEARL" title={<>Discover The<br />Pearl Experience.</>} copy="Watch how we bridge Uganda's indigenous heritage with world-class orchestral performance." />
          <span className="explainer-index">A SOUND OF MANY PLACES <i /> KAMPALA, UGANDA</span>
        </div>
        <a className="explainer-video" href="https://www.youtube.com/results?search_query=Pearl+Symphony+Orchestra+Uganda+performance" target="_blank" rel="noreferrer" aria-label="Find Pearl Symphony Orchestra performances on YouTube">
          <img src="/SON_4522.JPG.jpeg" alt="Pearl Symphony Orchestra musicians performing together" loading="lazy" />
          <span className="explainer-video-shade" />
          <span className="explainer-play"><Play size={24} fill="currentColor" /></span>
          <span className="explainer-video-label"><small>THE PEARL EXPERIENCE</small><strong>Tradition, in a new light.</strong></span>
          <span className="explainer-video-link">WATCH ON YOUTUBE <ArrowUpRight size={14} /></span>
        </a>
        <div className="explainer-stats">
          <div><strong>20–50</strong><span>musicians, scaled to your stage</span></div>
          <div><strong>6+</strong><span>traditional Ugandan instruments</span></div>
          <div><strong>ONE</strong><span>distinctive orchestral fusion</span></div>
        </div>
      </div>
    </section>
  )
}

function AboutPage() {
  return <>
    <PageIntro eyebrow="ABOUT THE PEARL" title={<>Many roots.<br />One unmistakable sound.</>} copy="A Ugandan orchestra, shaped by the sounds we grew up with and the stages we dream of." image="/Afro Grad.JPG.jpeg" />
    <About />
    <section className="well-wisher-section"><div className="page-width"><WellWisherCard /></div></section>
    <section className="repertoire-section section-pad"><div className="page-width">
      <SectionHeading eyebrow="THE REPERTOIRE" title={<>Tradition meets<br />the orchestra.</>} copy="A living musical conversation, arranged for each audience, venue and occasion." />
      <div className="repertoire-grid"><article><span>01</span><h3>Ugandan instruments</h3><p>Adungu, amadinda, engoma, endingidi, akogo and entongoli bring their unique timbres and histories into the ensemble.</p></article><article><span>02</span><h3>Orchestral sections</h3><p>Strings, woodwinds, brass and percussion add scale, colour and expressive range to every arrangement.</p></article><article><span>03</span><h3>Made for the moment</h3><p>From a chamber ensemble to 20–50 artists on stage, the line-up adapts to the story and space.</p></article></div>
    </div></section>
  </>
}

function PackagesPage() {
  const managedPackages = usePublishedRecords('packages')
  const configuredPackages = managedPackages?.length ? managedPackages : null
  const trioPackage = configuredPackages?.find((item) => /trio/i.test(item.packageName || ''))
  const defaultPackages = [
    { number: '02', title: 'Chamber Ensemble', description: 'An expressive, flexible line-up for focused performances and refined spaces.' },
    { number: '03', title: 'Full Orchestra', description: 'The full scale of Pearl: a powerful ensemble built for major stages and audiences.' },
    { number: '04', title: 'Gospel & Choir Fusion', description: 'A moving meeting of choir, orchestral colour and African musical heritage.' },
  ]
  const futurePackages = configuredPackages
    ? configuredPackages.filter((item) => item !== trioPackage).map((item, index) => ({
      number: String(index + (trioPackage ? 2 : 1)).padStart(2, '0'),
      title: item.packageName || 'Ensemble package',
      description: item.ensembleBreakdown || item.description || item.pricingNotes || 'Contact the orchestra to discuss this package.',
      notes: item.pricingNotes || 'CUSTOM QUOTATION',
    }))
    : defaultPackages
  return <>
    <PageIntro eyebrow="FIND YOUR PEARL EXPERIENCE" title={<>Performance &<br />Event Packages.</>} copy="From an intimate acoustic set to a full orchestral experience, find the right ensemble for your occasion." />
    <section className="packages-section section-pad">
      <div className="page-width">
        <div className="package-feature">
          <div className="package-video">
            {trioPackage?.videoMediaEmbeds && packageEmbedUrl(trioPackage.videoMediaEmbeds) && <iframe src={packageEmbedUrl(trioPackage.videoMediaEmbeds)} title="Trio package performance video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
            {(!trioPackage?.videoMediaEmbeds || !packageEmbedUrl(trioPackage.videoMediaEmbeds)) && <img src="/SON_4522.JPG.jpeg" alt="Pearl Symphony Orchestra performing together" loading="lazy" />}
            <span className="package-video-shade" />
            <span className="package-video-play"><Play size={23} fill="currentColor" /></span>
            <span className="package-video-note"><span className="live-dot" /> TRIO PERFORMANCE VIDEO · COMING SOON</span>
            <span className="package-video-count">01 / 04</span>
          </div>
          <div className="package-details">
            <span className="eyebrow"><span />FEATURED EXPERIENCE</span>
            <h2>{trioPackage?.packageName || <>The Trio<br />Package.</>}</h2>
            <p className="package-lede">{trioPackage?.description || 'An intimate, expressive first taste of the Pearl sound—where traditional Ugandan timbres meet the colour of classical strings.'}</p>
            <div className="package-fact"><span>THE ENSEMBLE</span><strong>{trioPackage?.ensembleBreakdown || '3-piece acoustic fusion'}</strong><p>A carefully balanced ensemble drawing on traditional and classical instrumentation.</p></div>
            <div className="package-fact"><span>MADE FOR</span><strong>Intimate occasions</strong><p>{trioPackage?.idealVenues || 'Executive cocktail events, private dinners, ceremonies and thoughtful celebrations.'}</p></div>
            <div className="package-fact"><span>SAMPLE REPERTOIRE</span><strong>Familiar melodies, newly arranged</strong><p>Ugandan favourites, African folk selections, gentle classics and custom requests.</p></div>
            <Link className="button button--green package-cta" to="/book-us">Request a custom quotation <ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="future-packages">
          <div className="future-packages-heading"><span className="eyebrow"><span />MORE WAYS TO EXPERIENCE THE PEARL</span><h2>More sound.<br />More possibilities.</h2></div>
          <div className="future-package-grid">{futurePackages.map((item) => <article className="future-package-card" key={item.number}><span>{item.number} <span>PACKAGE</span></span><h3>{item.title}</h3><p>{item.description}</p><small>{item.notes || 'DETAILS COMING SOON'}</small></article>)}</div>
        </div>
      </div>
    </section>
  </>
}

function MediaPage() {
  return <>
    <PageIntro eyebrow="THE PEARL, IN MOTION" title={<>Seen on stage.<br />Felt everywhere.</>} copy="Live moments, rehearsal-room details and the people behind the sound." image="/SON_4522.JPG.jpeg" />
    <Media />
    <section className="press-kit-section section-pad"><div className="page-width press-kit-panel"><div><span className="eyebrow"><span />PRESS & PARTNERS</span><h2>Everything you need to tell the Pearl story.</h2><p>Download official logo artwork or get in touch for high-resolution photography, orchestra biographies and press materials.</p></div><div className="press-kit-actions"><a className="button button--outline" href="/logo/Pearl%20Symphony%20Orchestra%20logo%202026_2-transparent.png" download>Download official logo <ArrowDown size={16} /></a><Link className="button button--green" to="/contact">Request the press kit <ArrowRight size={16} /></Link></div></div></section>
  </>
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const formData = Object.fromEntries(new FormData(form).entries())
    setSubmitting(true)
    setSubmitError('')
    try {
      await submitPublicInquiry({ ...formData, name: formData.name, topic: formData.topic, message: formData.message, source: 'contact' })
      setSubmitted(true)
      form.reset()
    } catch (error) {
      setSubmitError(error.message || 'We could not submit your message. Please try again or contact us directly.')
    } finally {
      setSubmitting(false)
    }
  }
  return <>
    <PageIntro eyebrow="CONTACT THE ORCHESTRA" title={<>Let's start<br />a conversation.</>} copy="For partnerships, media requests, collaborations and general enquiries, reach the Pearl team directly." />
    <section className="contact-section section-pad"><div className="page-width contact-grid">
      <div className="contact-details"><span className="eyebrow"><span />FIND THE PEARL</span><h2>Kampala, Uganda.<br />Music without borders.</h2><p>Our home is Kampala. Connect with us through our official channels for bookings, press enquiries, collaborations and the latest from the orchestra.</p>
        <div className="contact-facts"><div><small>BASED IN</small><strong>Kampala, Uganda</strong></div><div><small>CALL THE ORCHESTRA</small><a href={contactPhoneHref}>+{contactPhone} <ArrowUpRight size={14} /></a></div><div><small>WHATSAPP</small><a href={contactWhatsAppHref} target="_blank" rel="noreferrer">Message us on WhatsApp <ArrowUpRight size={14} /></a></div><div><small>FOLLOW & MESSAGE</small>{socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label === 'X' ? '@PearlSym4ny on X' : `Pearl Symphony on ${social.label}`} <ArrowUpRight size={14} /></a>)}</div></div>
        <div className="contact-map"><span className="map-pulse" /><div><small>OUR HOME</small><strong>Kampala</strong><span>Uganda · East Africa</span></div><span className="map-coordinate">KAMPALA<br />UGANDA</span></div>
      </div>
      <div className="contact-form-wrap">{submitted ? <div className="form-success" role="status"><span className="success-check"><Check size={25} /></span><span className="eyebrow"><span />MESSAGE RECEIVED</span><h3>Thank you for reaching out.</h3><p>Your message has been sent to the Pearl Symphony Orchestra team. We will be in touch soon.</p><button className="text-link form-reset" onClick={() => setSubmitted(false)}>Send another message <ArrowRight size={15} /></button></div> : <form className="booking-form contact-form" onSubmit={handleSubmit}><div className="form-intro"><span>SEND AN ENQUIRY</span><small>* REQUIRED FIELDS</small></div><div className="form-grid"><label>Your name *<input name="name" autoComplete="name" required placeholder="Full name" /></label><label>Email address *<input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></label><label className="form-full">What can we help with? *<select name="topic" required defaultValue=""><option value="" disabled>Choose an enquiry type</option><option>Booking an event</option><option>Artist collaboration</option><option>Press & media</option><option>Partnership</option><option>General question</option></select></label><label className="form-full">Your message *<textarea name="message" rows="5" required placeholder="Tell us a little more." /></label></div>{submitError && <p className="form-submit-error" role="alert">{submitError}</p>}<button className="button button--green form-submit" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'} <ArrowRight size={17} /></button><span className="form-privacy">Your inquiry is shared securely with the orchestra team.</span></form>}</div>
    </div></section>
  </>
}

function HomePage() {
  return <><Hero /><ExplainerVideo /><HomeHighlights /><DonationSection /></>
}

const pageTitles = {
  '/': 'Home',
  '/about': 'About',
  '/leadership': 'Leadership',
  '/musicians': 'Musicians',
  '/music': 'Music',
  '/media': 'Media',
  '/events': 'Events',
  '/packages': 'Our Packages',
  '/book-us': 'Book the Orchestra',
  '/contact': 'Contact',
}

function AppRoutes() {
  const location = useLocation()
  const routeClass = location.pathname === '/' ? 'home' : location.pathname.slice(1).replaceAll('/', '-')
  useEffect(() => {
    const pageTitle = pageTitles[location.pathname] ?? 'Page not found'
    document.title = `${pageTitle} | Pearl Symphony Orchestra`
    window.scrollTo(0, 0)
  }, [location.pathname])
  if (location.pathname.startsWith('/admin')) return <AdminPortal />
  return <><Header /><main key={location.pathname} className={`route-main route-main--${routeClass}`}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/leadership" element={<><PageIntro eyebrow="LEADERSHIP & ARTISTRY" title={<>The people<br />shaping our sound.</>} copy="Artistic vision, musical direction and the people bringing each performance together." image="/Afro Nuel .jpg.jpeg" /><People leadershipOnly /></>} />
    <Route path="/musicians" element={<><PageIntro eyebrow="THE PEOPLE OF PEARL" title={<>One ensemble.<br />Many voices.</>} copy="Explore the musicians, arrangers and section leaders giving the Pearl sound its character." image="/AfroUg3.PNG" /><People /></>} />
    <Route path="/music" element={<><PageIntro eyebrow="LISTEN CLOSELY" title={<>Music made<br />of many places.</>} copy="Original works and familiar melodies, reimagined for the orchestra." image="/Afro Grad.JPG.jpeg" /><Music /></>} />
    <Route path="/media" element={<MediaPage />} />
    <Route path="/events" element={<><PageIntro eyebrow="WHERE WE MEET" title={<>Good music.<br />Good company.</>} copy="A collaboration to remember and room for the next one to come." image="/AfroUg2.JPG.jpeg" /><Events /></>} />
    <Route path="/packages" element={<PackagesPage />} />
    <Route path="/book-us" element={<><PageIntro eyebrow="LET'S MAKE IT SING" title={<>Your occasion.<br />Our orchestra.</>} copy="Tell us what you are planning and we will help shape the right ensemble for your event." /><Booking /></>} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="*" element={<PageIntro eyebrow="404 · NOT FOUND" title={<>This page is<br />out of tune.</>} copy="The page you're looking for doesn't exist. Head home and find your way back to the Pearl." />} />
  </Routes></main><Footer /></>
}

export default function App() {
  return <AppRoutes />
}