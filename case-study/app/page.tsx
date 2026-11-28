import Image from "next/image";
import { CaseNav } from "@/components/CaseNav";
import { DesignIterationsEmbed } from "@/components/DesignIterationsEmbed";
import { SiteFooter } from "@/components/SiteFooter";
import { BarsEmbed } from "@/components/BarsEmbed";
import { ExpandableBody } from "@/components/ExpandableBody";
import { PrototypeEmbed } from "@/components/PrototypeEmbed";
import {
  AffinityClusters,
  InterviewBubbles,
} from "@/components/InterviewBubbles";
import { LogoOrbitEmbed } from "@/components/LogoOrbitEmbed";
import { SectionSpy } from "@/components/SectionSpy";
import { SurveyChartsStack } from "@/components/SurveyChartsStack";

const TITLE = "UniLocate: Activation design for an indoor campus navigator";

/* Story copy that sits inside the decisions and edge-case images. Kept as real
   text so search and AI readers get it too. Visually hidden; full text in /case.md */
const DECISIONS_TEXT = [
  { title: "Landing: search first", body: "New users can search for their college with no sign-up first, because their first use is on day one when they are nervous or in a hurry. Students who aren't searching can tap Get Started and set up an account instead." },
  { title: "Search results", body: "Each result shows a photo, full name, and location, since many colleges share similar names. Tags surface ongoing events, open registrations, and the nearest college." },
  { title: "Campus map kept simple", body: "Navigation comes down to a floor stepper and a search bar with filters that looks across all floors, so students don't need to know a place's floor before searching." },
  { title: "Navigation card", body: "A large direction guide with filters still visible during navigation, so a student can read the next step at a glance and adjust the route without leaving navigation." },
  { title: "Floor changes confirmed by the student", body: "The app can't detect a floor change by itself. At a stair or lift the card asks the student to confirm the floor, and the navigation pin stays put until they do." },
  { title: "Wing and building filters", body: "Students confused between wings can highlight specific wings and buildings, and select several at once, even during navigation." },
  { title: "Account request after arrival", body: "After reaching the destination the student is asked to create a profile, because they have just found the room without help (the aha moment). The screen says a profile unlocks more navigation." },
  { title: "Offline uses QR codes, not GPS", body: "Building materials weaken GPS indoors and its position is too imprecise for finding a room. A student scans a QR code in the building, and the map marks that code's location and floor as their position, with no connection needed." },
  { title: "QR codes across campus", body: "QR codes are placed around campus so a student can scan whichever is nearby. Each code is tied to one location, so scanning tells the app exactly where they are." },
  { title: "Sign-up later, for more features", body: "A student completes the first navigation without signing up. The next navigation requires sign-up and a profile, which unlocks location sharing, a default college, and class search by subject." },
];

const EDGE_TEXT = [
  { title: "Similar college names", body: "Search shows every matching college so the student can pick the right one. A Nearest tag marks the college closest to them." },
  { title: "Results loading", body: "A skeleton of the result cards appears while college data loads, so the page doesn't sit blank." },
  { title: "Map loading", body: "A skeleton of the map builds up, with a label that changes as it loads, such as \u201cFinding your bearings\u2026\u201d." },
  { title: "College not mapped yet", body: "The screen says \u201cSorry, College not mapped yet\u201d and offers a Request Map button. The request carries the college name and student name, so demand for mapping can be seen." },
  { title: "College doesn't exist", body: "An empty plot with a question mark and the text \u201cCollege doesn't exist\u201d, so the result is clear at a glance." },
  { title: "No internet", body: "The screen says \u201cYou\u2019re offline. Saved campus maps still work without a connection.\u201d The Use Offline Maps button appears only if the student has signed up and saved a map." },
];

/* Hand-off files: the Figma design file and the FigJam research board */
const HANDOFF_LINKS = [
  {
    eyebrow: "Figma",
    title: "Design",
    body: "UniLocate Rework: the design file.",
    href: "https://www.figma.com/design/AylCl5rDvMwaj4NilQsv8D/UniLocate-Rework?node-id=7-34&t=grRN7vMg829mVkHL-1",
  },
  {
    eyebrow: "FigJam",
    title: "Research",
    body: "UniLocate Research (Rework): the research board.",
    href: "https://www.figma.com/board/q8OZGkzdqLC4C1xYqRfQgi/UniLocate-Research--Rework-?node-id=0-1&t=KeScy81Clwof57pP-1",
  },
];

const SITE_URL = "https://unilocate-case-study.vercel.app";

/* Machine-readable summary of the case study. Mirrors the visible page. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description:
    "Concept case study for UniLocate, an indoor campus navigator for students on a first visit. Activation design: skip sign-up, get a route in 3 taps, QR checkpoints for offline navigation.",
  url: `${SITE_URL}/`,
  mainEntityOfPage: `${SITE_URL}/`,
  image: `${SITE_URL}/og-image.jpg?v=2`,
  inLanguage: "en",
  isAccessibleForFree: true,
  author: {
    "@type": "Person",
    name: "Harshal",
    sameAs: [
      "https://www.linkedin.com/in/harshaljadhav15/",
      "https://x.com/Har5hal_",
      "https://medium.com/@harshalj0815",
    ],
  },
  about: ["Indoor navigation", "Campus wayfinding", "Product activation", "UX case study"],
  workExample: {
    "@type": "WebApplication",
    name: "UniLocate prototype",
    url: `${SITE_URL}/prototype-app/index.html`,
    applicationCategory: "NavigationApplication",
  },
};

/* Target users: sourced from AISHE 2023-24; ages kept at the 18 to 22 range */
const USER_STATS = [
  { label: "Average age of students in India", value: "18–22", unit: "years" },
  { label: "New entrants in India", value: "~1.3 crore", unit: "students per year" },
  { label: "Enrolled students in India", value: "4.50 crore", unit: "students in 2023–24" },
  { label: "Total colleges in India", value: "46,468", unit: "colleges" },
  { label: "Average college size in India", value: "~5–10", unit: "acres per college" },
  { label: "Average college size in India", value: "~2.0–4.0", unit: "hectares per college" },
];

export default function CaseStudyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <CaseNav />
      <SectionSpy />

      <main className="case-main">
        <section
          id="thumbnail"
          className="case-section"
          aria-labelledby="thumbnail-title"
        >
          <h1 id="thumbnail-title" className="sr-only">
            {TITLE}
          </h1>

          <figure className="thumbnail">
            <div className="thumbnail__frame sticker squircle">
              <Image
                className="thumbnail__img"
                src="/thumbnail.webp?v=2"
                alt={`${TITLE}. Hero of the concept case study: phone showing an indoor campus map route, with a student sticker figure on the path.`}
                width={2240}
                height={1258}
                priority
                draggable={false}
                sizes="(max-width: 1120px) 100vw, 1120px"
              />
            </div>
            <figcaption className="sr-only">
              Concept case study thumbnail for UniLocate, a Type C new product:
              an indoor campus navigator. Primary AARRR focus is Activation via
              pre-account indoor routing on a first campus visit. No live
              product metric is claimed. Title: {TITLE}.
            </figcaption>
          </figure>
        </section>

        <section
          id="brief"
          className="case-section"
          aria-labelledby="brief-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">1. Project Brief</p>
            <h2 id="brief-title" className="section-title">
              What is UniLocate?
            </h2>
            <ExpandableBody>
              <p className="section-body">
                UniLocate is an{" "}
                <mark className="mark">indoor campus navigator</mark> that helps
                students who need to reach a classroom or any particular campus
                location{" "}
                <mark className="mark">
                  in the first few weeks of college, at an event, during exam
                  time, or on a visit to a different college
                </mark>
                . It gets them onto a clear indoor route with floors, stairs,
                lifts, and filters.
              </p>
            </ExpandableBody>
          </div>

          <figure className="section-visual">
            <Image
              className="section-visual__img"
              src="/what-is-unilocate.webp"
              alt="UniLocate product overview collage: phone with Search College and Get Started; indoor floor map; campus building photo; map pin, college, and graduation stickers; campus-life polaroids; personality tags Senior energy day one and Freshman ally. App ideas: Fast, Offline support, Share location, On-time navigation, Search first, Skip signup."
              width={2240}
              height={1310}
              draggable={false}
              sizes="(max-width: 1120px) 100vw, 1120px"
            />
            <figcaption className="sr-only">
              What is UniLocate visual. Indoor campus navigator product collage
              for the Project Brief. Elements: search-college first screen on
              phone, indoor floor map with labeled spaces (canteen, atrium,
              library, wings), campus building photo card, map-pin sticker,
              college-building sticker, graduation-cap sticker, campus-life
              polaroids. Personality word tags in the artwork: Senior energy,
              day one; Freshman ally. Product personality and capability tags
              for AI: Fast; Offline support; Share location; On-time navigation;
              Search first; Skip signup. No border or rounded frame on this
              figure.
            </figcaption>
          </figure>

          <div className="case-section--prose">
            <h3 className="section-subhead">Constraints</h3>
            <ExpandableBody>
              <p className="section-body">
                As a{" "}
                <mark className="mark">new product</mark>, the work had to focus
                on <mark className="mark">Activation</mark>, the user’s first
                moment with UniLocate. It is also a{" "}
                <mark className="mark">concept case study with no backend</mark>
                , so accuracy{" "}
                <mark className="mark">
                  could not be tested in a live system
                </mark>
                . GPS is not suitable indoors, so it has to{" "}
                <mark className="mark">
                  rely on other indoor positioning approaches
                </mark>{" "}
                such as BLE RSSI / RTT, or any other way around.
              </p>
            </ExpandableBody>
          </div>

          <figure
            className="section-visual section-visual--embed"
            aria-label="Constraints visual"
          >
            <LogoOrbitEmbed />
            <figcaption className="sr-only">
              Constraints visual. UniLocate logo with orbiting stickers for
              indoor positioning ideas: satellite, phone, router, and aha
              moment. Plays only while this figure is on screen.
            </figcaption>
          </figure>
        </section>

        <section
          id="research"
          className="case-section"
          aria-labelledby="research-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">2. Problem Exploration</p>
            <h2 id="research-title" className="section-title">
              Problem Discovery
            </h2>
            <ExpandableBody>
              <p className="section-body">
                On my first day I was{" "}
                <mark className="mark">lost in wings</mark> and corridors trying
                to{" "}
                <mark className="mark">reach class on time</mark>, same as every
                other freshman. Seniors were assigned to help, but they{" "}
                <mark className="mark">
                  couldn’t assist people one by one
                </mark>
                . In my third year the freshers were still stuck in the same
                loop. That is when I saw room for a{" "}
                <mark className="mark">digital product</mark> to close the gap.
              </p>
            </ExpandableBody>
          </div>

          <figure className="section-visual section-visual--crop section-visual--credit sticker squircle">
            <Image
              className="section-visual__img"
              src="/problem-discovery.webp"
              alt="Busy college hallway with students carrying backpacks between classes, the first-day campus navigation problem UniLocate addresses."
              width={1840}
              height={1227}
              draggable={false}
              sizes="(max-width: 1120px) 100vw, 1120px"
            />
            <figcaption className="sr-only">
              Problem Discovery visual. Students moving through a crowded campus
              corridor between classes, grounding the freshman navigation gap
              described above. Thick white sticker rim with squircle corners. AI
              generated image.
            </figcaption>
          </figure>

          <div className="case-section--prose">
            <h3 className="section-subhead">Qualitative research</h3>
            <ExpandableBody>
              <p className="section-body">
                I spoke with students from different colleges. Calls were
                transcribed into atomic notes and sorted into affinity clusters.
                The ones I kept were where people{" "}
                <mark className="mark">
                  couldn’t find a classroom because maps and signs didn’t get
                  them there
                </mark>
                , where{" "}
                <mark className="mark">
                  wings and departments blend so you only notice you’re wrong
                  later
                </mark>
                , and where even students who know the campus struggle with{" "}
                <mark className="mark">
                  one-off exam rooms, events, or a class that moved
                </mark>
                . Time lost and late arrivals showed up across those stories.
              </p>
            </ExpandableBody>
          </div>

          <AffinityClusters />

          <div className="case-section--prose">
            <h3 className="section-subhead">Quantitative research</h3>
            <ExpandableBody>
              <p className="section-body">
                Quantitative research was done with a survey to{" "}
                <mark className="mark">
                  triangulate the interview findings
                </mark>
                . It was carried out with students from around{" "}
                <mark className="mark">4 to 5 colleges</mark>, and helped show{" "}
                <mark className="mark">how often this had happened</mark>,{" "}
                <mark className="mark">
                  how long it took to find a location
                </mark>
                ,{" "}
                <mark className="mark">
                  how long it took to get comfortable locating places
                </mark>
                , and other quantified details.
              </p>
            </ExpandableBody>
          </div>

          <SurveyChartsStack />
        </section>

        <section
          id="users"
          className="case-section"
          aria-labelledby="users-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">3. Target users</p>
            <h2 id="users-title" className="section-title">
              Who this is for
            </h2>
            <ExpandableBody>
              <p className="section-body">
                <mark className="mark">18 to 22 year old students</mark> arrive
                on an <mark className="mark">unfamiliar campus</mark> for an{" "}
                <mark className="mark">exam or event</mark>. They can’t find the
                venue, the people nearby don’t know either, and with only
                minutes left they have{" "}
                <mark className="mark">no time to spare</mark>. The same person
                shows up as a <mark className="mark">newcomer</mark> in the
                first days and weeks, trying to reach class before the pressure
                spikes.
              </p>
            </ExpandableBody>
          </div>
          <p className="stat-note">
            <strong>Approximate market size (TAM).</strong> These figures are
            estimates compiled from several public sources, mainly AISHE 2023–24
            (All India Survey on Higher Education) and UGC campus norms.
          </p>
          <ul className="stat-stickers" aria-label="Who the students are in India, in numbers">
            {USER_STATS.map((s) => (
              <li key={`${s.label}-${s.unit}`} className="stat-sticker sticker squircle">
                <span className="stat-sticker__label">{s.label}</span>
                <strong className="stat-sticker__value">{s.value}</strong>
                <span className="stat-sticker__unit">{s.unit}</span>
              </li>
            ))}
          </ul>
          <figure
            className="section-visual section-visual--crowd"
            aria-label="Students walking across a campus"
          >
            <iframe
              className="section-visual__embed section-visual__embed--crowd"
              src="/crowd-hero-animation.html?v=2"
              title="Students walking across a campus"
              loading="lazy"
              tabIndex={-1}
            />
            <figcaption className="sr-only">
              Animated crowd of students walking in both directions, in layers
              of depth. Decorative.
            </figcaption>
          </figure>
        </section>

        <section
          id="problem"
          className="case-section"
          aria-labelledby="problem-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">4. Problem Statement</p>
            <h2 id="problem-title" className="section-title">
              The problem
            </h2>
            <ExpandableBody>
              <p className="section-body">
                A freshman on the first day struggles to{" "}
                <mark className="mark">
                  locate class and other places on campus
                </mark>{" "}
                because there are{" "}
                <mark className="mark">
                  no usable signboards or maps that get them there
                </mark>
                , and{" "}
                <mark className="mark">wings and sections look the same</mark>,
                so they turn wrong and only notice later. That leads to{" "}
                <mark className="mark">
                  late arrivals or missed lectures and events
                </mark>
                .
              </p>
              <p className="section-body">
                Which means UniLocate has to get them a{" "}
                <mark className="mark">
                  clear indoor route without relying on static maps or signs
                </mark>
                , and help them{" "}
                <mark className="mark">
                  understand which wing or section they’re in
                </mark>{" "}
                while they move. Activation is the bet:{" "}
                <mark className="mark">skip sign-up</mark>, get a route in a few
                taps, prove the value on the first visit, then ask for an
                account after they arrive.
              </p>
            </ExpandableBody>
          </div>

          <InterviewBubbles />
        </section>

        <section
          id="ideation"
          className="case-section"
          aria-labelledby="ideation-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">5. Ideation</p>
            <h2 id="ideation-title" className="section-title">
              Ideas explored
            </h2>
            <ExpandableBody>
              <p className="section-body">
                The open question was{" "}
                <mark className="mark">Activation</mark>: how a first visit
                could succeed under time pressure without sign-up.
              </p>
              <ul className="section-list">
                <li>
                  An{" "}
                  <mark className="mark">always-on wing colour layer</mark> that
                  gives each building its own colour and border every wing by
                  default.
                  <br />
                  <strong>Not Selected:</strong> students use this map when
                  they are already nervous, and showing every wing at once could
                  overwhelm or confuse them.
                </li>
                <li>
                  An{" "}
                  <mark className="mark">index listing</mark> that matches each
                  colour to a wing or building, instead of filters.
                  <br />
                  <strong>Not Selected:</strong> students would have to look up
                  a colour in the list and then find it on the map, which costs
                  more time and adds friction.
                </li>
                <li>
                  A{" "}
                  <mark className="mark">static offline map download</mark>: a
                  plain map without live navigation, so the path still works
                  when indoor signal drops.
                  <br />
                  <strong>Not Selected:</strong> navigating indoors with GPS
                  alone isn&apos;t possible, and colleges already have static
                  maps that often add to the confusion.
                </li>
                <li>
                  <mark className="mark">Sign-up first</mark> before search and
                  route, so the account is ready from the first visit.
                  <br />
                  <strong>Not Selected:</strong> the situation wasn&apos;t
                  suitable for sign-up, and it is a better opportunity to let
                  students see the value of the app before asking for anything.
                </li>
              </ul>
            </ExpandableBody>
          </div>

          <figure className="section-visual">
            <Image
              className="section-visual__img"
              src="/ideas-explored.webp?v=2"
              alt="Four rejected ideas from ideation, each with a phone mockup: an always-on wing colour map, a colour index listing of wings and buildings, a plain static offline map, and a sign-up first screen."
              width={1840}
              height={4857}
              draggable={false}
              sizes="(max-width: 1120px) 100vw, 1120px"
            />
            <figcaption className="sr-only">
              Ideas explored visual. Phone mockups for the four rejected
              directions: wing colour layer on the map, a colour index listing
              instead of filters, a plain static offline map, and sign-up before
              route.
            </figcaption>
          </figure>

          <div className="case-section--prose">
            <h3 className="section-subhead">Concept Development</h3>
            <ExpandableBody>
              <ul className="section-list">
                <li>
                  UniLocate opens{" "}
                  <mark className="mark">without an account</mark> because
                  students are usually under time pressure. Getting a route
                  first is what creates the{" "}
                  <mark className="mark">aha moment</mark> and completes{" "}
                  <mark className="mark">Activation</mark>.
                </li>
                <li>
                  Students tell wings apart with a{" "}
                  <mark className="mark">filter on demand</mark>, not a default
                  colour layer, so the map stays clear and they only turn it on
                  when they need that flexibility.
                </li>
                <li>
                  To avoid the confusion of{" "}
                  <mark className="mark">static maps</mark>,{" "}
                  <mark className="mark">QR codes</mark> sit at set intervals.
                  Scanning one reveals that point’s location, so students can
                  keep navigating as they move.
                </li>
              </ul>
            </ExpandableBody>
          </div>

          <figure className="section-visual">
            <Image
              className="section-visual__img"
              src="/concept-development.webp"
              alt="Three phone mockups for the chosen concept: Get Started without an account, wing filters on demand, and QR scan for offline navigation, with Experience First, Navigate Flexibly, and Offline Navigation stickers."
              width={1840}
              height={939}
              draggable={false}
              sizes="(max-width: 1120px) 100vw, 1120px"
            />
            <figcaption className="sr-only">
              Concept development visual. Phone mockups for experience first
              without account, filter on demand for wings, and QR-based offline
              navigation.
            </figcaption>
          </figure>
        </section>

        <section
          id="journey"
          className="case-section"
          aria-labelledby="journey-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">6. Journey Mapping</p>
            <h2 id="journey-title" className="section-title">
              First-visit journey
            </h2>
            <ExpandableBody>
              <p className="section-body">
                The product story was mapped across AARRR. This case study bets
                on <mark className="mark">Activation</mark>: the first session
                where a hurried student reaches the room. The other stages sit
                as <mark className="mark">hypothesis</mark> around that moment.
              </p>
            </ExpandableBody>
          </div>

          <div className="journey-board">
            <div className="journey-table-wrap sticker">
              <div className="journey-table-scroll">
                <div className="journey-table-rail">
                  <table className="journey-table">
                    <caption className="sr-only">
                      AARRR journey map with Action, Emotion, and Touchpoints
                      across Acquisition, Activation, Engagement, Retention, and
                      Referral.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="journey-table__corner" />
                        <th scope="col">
                          Acquisition
                          <span className="journey-table__tag">Hypothesis</span>
                        </th>
                        <th scope="col" className="journey-table__focus">
                          Activation
                        </th>
                        <th scope="col">
                          Engagement
                          <span className="journey-table__tag">Hypothesis</span>
                        </th>
                        <th scope="col">
                          Retention
                          <span className="journey-table__tag">Hypothesis</span>
                        </th>
                        <th scope="col">
                          Referral
                          <span className="journey-table__tag">Hypothesis</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Action</th>
                        <td>
                          College message: “Download UniLocate to find your
                          classes,” or a QR outside campus on day one → open link
                          → download the app
                        </td>
                        <td className="journey-table__focus">
                          Search college → select the right campus when names
                          match → map opens → search classroom number → navigate
                          → reached
                        </td>
                        <td>
                          Seminar or event notification → open → locate →
                          navigate. Free walkthrough in the first week.
                        </td>
                        <td>
                          Classroom update from the teacher dashboard → open
                          notification → find the new room
                        </td>
                        <td>
                          Friend asks “Where are you?” → share location through
                          the app
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Emotion</th>
                        <td>
                          <mark className="mark">Realization</mark>
                          <br />
                          Finding class might actually be a problem
                        </td>
                        <td className="journey-table__focus">
                          <mark className="mark">Nervous, Curious</mark>
                          <br />
                          First day of college, will I reach my class on time?
                        </td>
                        <td>
                          <mark className="mark">Curious</mark>
                          <br />
                          Wants to explore the new college
                        </td>
                        <td>
                          <mark className="mark">Relaxed</mark>
                          <br />
                          No worry about classroom changes or hunting for exam
                          halls
                        </td>
                        <td>
                          <mark className="mark">Confident</mark>
                          <br />
                          Sure enough to share location and help a friend
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Touchpoints</th>
                        <td>
                          Play Store listing → icon → download → open → opening
                          animation
                        </td>
                        <td className="journey-table__focus">
                          Search bar → type college name → select college → enter
                          destination → navigate
                        </td>
                        <td>
                          Notification → map opens and locates event → navigate
                          to event
                        </td>
                        <td>
                          Notification → open app → class marker updated →
                          navigate
                        </td>
                        <td>Open app → kebab menu → Share Location</td>
                      </tr>
                    </tbody>
                  </table>
                  <div
                    className="journey-table__activation-frame"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <aside className="journey-revenue sticker" aria-label="Revenue">
              <div className="journey-revenue__inner">
                <p className="journey-revenue__kicker">Revenue</p>
                <p className="journey-revenue__meta">App POV</p>
                <p className="journey-revenue__body">
                  The app charges colleges for mapping and technology, plus a
                  subscription to a dashboard where they can assign classrooms,
                  update them, and notify students.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section
          id="decisions"
          className="case-section"
          aria-labelledby="decisions-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">7. Decisions</p>
            <h2 id="decisions-title" className="section-title">
              What was decided
            </h2>
            <ExpandableBody>
              <p className="section-body">
                Each call was made against a rejected option, with its
                trade-off written beside it.
              </p>
            </ExpandableBody>
          </div>

          <figure className="section-visual">
            <Image
              className="section-visual__img"
              src="/what-was-decided.webp"
              alt="What was decided: each design decision set against the option it rejected, with the trade-off written beside it."
              width={1840}
              height={9735}
              draggable={false}
              sizes="(max-width: 900px) 100vw, 920px"
            />
          </figure>
          <div className="sr-only">
            <h3>Decisions, as text</h3>
            <ol>
              {DECISIONS_TEXT.map((d) => (
                <li key={d.title}>
                  <strong>{d.title}.</strong> {d.body}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="prototype"
          className="case-section"
          aria-labelledby="prototype-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">8. Prototype</p>
            <h2 id="prototype-title" className="section-title">
              Try the prototype
            </h2>
            <ExpandableBody>
              <p className="section-body">
                The <mark className="mark">first-visit flow</mark>, built to be
                tapped: search a college, open its campus map, and navigate to a
                room. The list on the left jumps to any screen. The controls on
                the right switch between first open and signed in, online and
                offline, and mapped or not mapped colleges, and turn sound and
                motion on or off.
              </p>
            </ExpandableBody>
          </div>

          <figure className="section-visual section-visual--prototype">
            <PrototypeEmbed />
            <div className="proto-desktop-note" role="note">
              <p className="proto-desktop-note__kicker">Interactive prototype</p>
              <h3 className="proto-desktop-note__title">
                Open this on a desktop
              </h3>
              <p className="proto-desktop-note__body">
                The phone mockup and controls sit side by side, so they need a
                wider screen. Come back on a laptop to try the flows.
              </p>
            </div>
            <figcaption className="sr-only">
              Interactive UniLocate prototype. A phone frame shows the
              first-visit flow, with a screen list on the left and stage
              controls on the right.
            </figcaption>
          </figure>
        </section>

        <section
          id="tradeoffs"
          className="case-section"
          aria-labelledby="tradeoffs-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">9. Trade-offs</p>
            <h2 id="tradeoffs-title" className="section-title">
              What the bet costs
            </h2>
            <ExpandableBody>
              <ul className="section-list">
                <li>
                  I let students navigate{" "}
                  <mark className="mark">without an account instead</mark> of
                  asking them <mark className="mark">to sign up first</mark>,
                  because interviews and the survey showed{" "}
                  <mark className="mark">they were nervous and anxious</mark>.
                  The trade-off was{" "}
                  <mark className="mark">fewer sign-ups on day one</mark>, which
                  was acceptable because the metric is activation, and sign-up
                  is only deferred to their next navigation.
                </li>
                <li>
                  I chose QR{" "}
                  <mark className="mark">scanning at intervals</mark> over
                  real-time GPS because{" "}
                  <mark className="mark">GPS is too imprecise indoors</mark>,
                  and offline mode can&apos;t combine it with Wi-Fi signals the
                  way online mode can. The trade-off was{" "}
                  <mark className="mark">
                    extra friction in offline navigation
                  </mark>
                  , and I expect fewer people to use offline mode. That was
                  acceptable because{" "}
                  <mark className="mark">accuracy matters more than speed</mark>
                  : a wrong location hurts a student more than a scan does.
                </li>
              </ul>
            </ExpandableBody>
          </div>

          <figure className="section-visual section-visual--bars">
            <BarsEmbed />
          </figure>
        </section>

        {/* Anchors so section spy links resolve until those sections are written */}
        <section
          id="edge"
          className="case-section"
          aria-labelledby="edge-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">10. Edge cases and states</p>
            <h2 id="edge-title" className="section-title">
              When the flow breaks
            </h2>
          </div>

          <figure className="section-visual">
            <Image
              className="section-visual__img"
              src="/edge-cases.webp"
              alt="Edge cases: search with similar college names, results loading, map loading, a college not yet mapped, a college that does not exist, and no internet connection."
              width={1840}
              height={6982}
              draggable={false}
              sizes="(max-width: 900px) 100vw, 920px"
            />
          </figure>
          <div className="sr-only">
            <h3>Edge cases, as text</h3>
            <ol>
              {EDGE_TEXT.map((e) => (
                <li key={e.title}>
                  <strong>{e.title}.</strong> {e.body}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="iterations"
          className="case-section"
          aria-labelledby="iterations-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">11. Design iterations</p>
            <h2 id="iterations-title" className="section-title">
              Every version I tried
            </h2>
            <ExpandableBody>
              <p className="section-body">
                One component at a time, from the first version to the final
                one. Tap a card to step through its versions.
              </p>
            </ExpandableBody>
          </div>

          <figure className="section-visual">
            <DesignIterationsEmbed />
            <figcaption className="sr-only">
              Design iterations: the CTA button, chips, icons, college result
              cards, floor stepper, and the landing, map and sign-up screens,
              each shown across the versions tried.
            </figcaption>
          </figure>
        </section>

        <section
          id="handoff"
          className="case-section"
          aria-labelledby="handoff-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">12. Hand off</p>
            <h2 id="handoff-title" className="section-title">
              Design and research files
            </h2>
            <ExpandableBody>
              <p className="section-body">
                The design file and the research board, for anyone who wants to
                look past the prototype.
              </p>
            </ExpandableBody>
          </div>

          <ul className="handoff" aria-label="Design and research files">
            {HANDOFF_LINKS.map((h) => (
              <li key={h.href}>
                <a
                  className="handoff-card sticker squircle"
                  href={h.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="handoff-card__eyebrow">{h.eyebrow}</span>
                  <span className="handoff-card__title">{h.title}</span>
                  <span className="handoff-card__body">{h.body}</span>
                  <span className="handoff-card__cta" aria-hidden="true">
                    Open file ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="learnings"
          className="case-section"
          aria-labelledby="learnings-title"
        >
          <div className="case-section--prose">
            <p className="section-kicker">13. Learnings</p>
            <h2 id="learnings-title" className="section-title">
              What I took from this
            </h2>
          </div>

          <div className="case-section--prose">
            <ol className="section-list">
              <li>
                <mark className="mark">Iterating pays off most on the screens that matter.</mark>{" "}
                Fitting the map on screen took three to four iterations, and so
                did the first screen a new user sees.
              </li>
              <li>
                <mark className="mark">Small details change how a design feels.</mark>{" "}
                A button that scales down on click or an elastic effect on
                scroll costs little, but it makes the app feel responsive.
              </li>
              <li>
                <mark className="mark">A small issue can become an opportunity.</mark>{" "}
                Students being nervous on their first day meant sign-up first
                was wrong, but it also gave a chance to show the app&apos;s value
                before asking for anything.
              </li>
              <li>
                <mark className="mark">Numbers add weight.</mark> Besides the
                survey data, I found and estimated the TAM, which shows the size
                of the opportunity.
              </li>
              <li>
                <mark className="mark">Presentation matters as much as the design itself.</mark>{" "}
                How the case study looks and how clearly I explain each decision
                both affect whether a reader understands the work.
              </li>
            </ol>
          </div>

          <figure className="section-visual learnings-figure sticker squircle">
            <Image
              className="section-visual__img"
              src="/learnings.webp?v=4"
              alt="Close-up of the UniLocate app icon being drawn in Figma on a laptop screen, with the UniLocate wordmark outlined on the right."
              width={1024}
              height={598}
              draggable={false}
              sizes="(max-width: 900px) 100vw, 920px"
            />
            <figcaption className="sr-only">
              Designing the UniLocate app icon in Figma, on a laptop.
            </figcaption>
          </figure>
        </section>

        <div id="outcome" hidden />
      </main>
      <SiteFooter />
    </>
  );
}
