import Image from "next/image";
import { CaseNav } from "@/components/CaseNav";
import { SectionSpy } from "@/components/SectionSpy";

const TITLE = "UniLocate: Activation design for an indoor campus navigator";

export default function CaseStudyPage() {
  return (
    <>
      <CaseNav />
      <SectionSpy activeId="thumbnail" />

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
                sizes="(max-width: 1120px) 100vw, 1120px"
              />
            </div>
            {/* Visible UI is the image; this stays in the DOM for AI / assistive tech */}
            <figcaption className="sr-only">
              Concept case study thumbnail for UniLocate, a Type C new product:
              an indoor campus navigator. Primary AARRR focus is Activation via
              pre-account indoor routing on a first campus visit. No live
              product metric is claimed. Title: {TITLE}.
            </figcaption>
          </figure>
        </section>

        {/* Anchors so section spy links resolve until those sections are written */}
        <div id="brief" hidden />
        <div id="research" hidden />
        <div id="users" hidden />
        <div id="problem" hidden />
        <div id="ideation" hidden />
        <div id="decisions" hidden />
        <div id="prototype" hidden />
        <div id="edge" hidden />
        <div id="outcome" hidden />
      </main>
    </>
  );
}
