import Image from "next/image";
import { CaseNav } from "@/components/CaseNav";
import { DesignIterationsEmbed } from "@/components/DesignIterationsEmbed";
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
                src="/thumbnail.webp"
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
                  paints every wing a different colour so sections stay visible.
                  <br />
                  <strong>Not Selected:</strong> too many colours on the map
                  would make the path harder to read, not clearer.
                </li>
                <li>
                  A{" "}
                  <mark className="mark">static offline map download</mark> so the
                  path still works when indoor signal drops.
                  <br />
                  <strong>Not Selected:</strong> colleges already place static
                  maps at a few points, and students still get lost.
                </li>
                <li>
                  <mark className="mark">Sign-up first</mark> before search and
                  route, so the account is ready from the first visit.
                  <br />
                  <strong>Not Selected:</strong> the moment someone opens the
                  app is usually time pressure, so they need to use the product
                  first, not set up an account.
                </li>
              </ul>
            </ExpandableBody>
          </div>

          <figure className="section-visual">
            <Image
              className="section-visual__img"
              src="/ideas-explored.webp"
              alt="Three phone mockups from ideation: a map with an always-on wing colour overlay, a sign-up first screen, and a static offline floor plan."
              width={1840}
              height={1076}
              draggable={false}
              sizes="(max-width: 1120px) 100vw, 1120px"
            />
            <figcaption className="sr-only">
              Ideas explored visual. Phone mockups for the rejected directions:
              wing colour layer on the map, sign-up before route, and a static
              offline campus plan.
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
                  I let students navigate without an account over asking them to
                  sign up first, because interviews and the survey showed
                  students were nervous and anxious. The trade-off I accepted
                  was fewer students creating an account on their first day.
                  That was acceptable because the metric is activation (a
                  student completing their first navigation), and sign-up is
                  only deferred: they still create a profile before their next
                  navigation.
                </li>
                <li>
                  I chose QR scanning at intervals over real-time GPS location
                  because the online mode can combine GPS with Wi-Fi signals,
                  but offline only GPS is available, and GPS is too imprecise
                  indoors. The trade-off I accepted was extra friction in offline
                  navigation, and I expect fewer people to use offline mode
                  because of it. That was acceptable because accuracy matters
                  more than speed here: a student who is told the wrong location
                  is worse off than one who has to scan a code.
                </li>
              </ul>
            </ExpandableBody>
          </div>
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

        <div id="outcome" hidden />
      </main>
    </>
  );
}
