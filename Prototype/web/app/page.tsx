import IPhoneFrame from "@/components/IPhoneFrame";
import UniLocateFlow from "@/components/UniLocateFlow";

export default function HomePage() {
  return (
    <main className="prototype-canvas">
      <div className="prototype-flow">
        <IPhoneFrame>
          <UniLocateFlow />
        </IPhoneFrame>
      </div>
    </main>
  );
}
