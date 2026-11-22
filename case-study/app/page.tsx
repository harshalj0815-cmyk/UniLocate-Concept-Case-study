import Image from "next/image";
import { CaseNav } from "@/components/CaseNav";
import { ExpandableBody } from "@/components/ExpandableBody";
import {
  AffinityClusters,
  InterviewBubbles,
} from "@/components/InterviewBubbles";
import { SectionSpy } from "@/components/SectionSpy";
import { SurveyChartsStack } from "@/components/SurveyChartsStack";

const TITLE = "UniLocate: Activation design for an indoor campus navigator";

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
                src="/thumbnail.png"
                alt={`${TITLE}. Hero of the concept case study: phone showing an indoor campus map route, with a student sticker figure on the path.`}
                width={1920}
                height={1080}
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
              src="/what-is-unilocate.png"
              alt="UniLocate product overview collage: phone with Search College and Get Started; indoor floor map; campus building photo; map pin, college, and graduation stickers; campus-life polaroids; personality tags Senior energy day one and Freshman ally. App ideas: Fast, Offline support, Share location, On-time navigation, Search first, Skip signup."
              width={2400}
              height={1500}
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
            className="section-visual section-visual--slot"
            aria-label="Constraints visual placeholder"
          >
            <div className="section-visual__slot" />
            <figcaption className="sr-only">
              Placeholder for a Constraints visual. Image to be added.
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
                The primary user is an{" "}
                <mark className="mark">18 to 22 year old student</mark> on an{" "}
                <mark className="mark">unfamiliar campus</mark>, most often a{" "}
                <mark className="mark">newcomer</mark> trying to reach class or
                another place in the first days and weeks. The scope card moment
                is the same person under time pressure: a student who arrives
                for an{" "}
                <mark className="mark">exam or event</mark>, can’t find the
                venue, asks nearby and still doesn’t get there, with only
                minutes left and{" "}
                <mark className="mark">no patience for sign-up</mark>. Event and
                exam visits stay in scope as related moments, not the primary
                one.
              </p>
            </ExpandableBody>
          </div>
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
                  Charging colleges for mapping and technology, plus a
                  subscription dashboard for assigning classrooms, updating
                  them, or notifying students.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Anchors so section spy links resolve until those sections are written */}
        <div id="decisions" hidden />
        <div id="prototype" hidden />
        <div id="edge" hidden />
        <div id="outcome" hidden />
      </main>
    </>
  );
}
