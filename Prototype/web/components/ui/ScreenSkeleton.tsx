/** Placeholder shown for a moment when a screen is opened from the stepper */
export default function ScreenSkeleton() {
  return (
    <div className="ul-screen-skel" aria-hidden>
      <span className="cr-skel__bone ul-screen-skel__icon" />
      <span className="cr-skel__bone ul-screen-skel__title" />
      <span className="cr-skel__bone ul-screen-skel__title ul-screen-skel__title--short" />
      <span className="cr-skel__bone ul-screen-skel__search" />
      <span className="cr-skel__bone ul-screen-skel__card" />
      <span className="cr-skel__bone ul-screen-skel__cta" />
    </div>
  );
}
