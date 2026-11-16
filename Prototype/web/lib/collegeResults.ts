export type ResultChip = {
  label: string;
  /** CSS background-image */
  fill: string;
  border: string;
};

export type CollegeResult = {
  id: string;
  name: string;
  image: string;
  chips: ResultChip[];
};

/** Paper CollegeResults-FirstTime cards — CollegeImage-01…03 from illustrations */
export const COLLEGE_RESULTS: CollegeResult[] = [
  {
    id: "art-commerce",
    name: "Pillai College of Art Commerce and Science, New Panvel",
    image: "/images/CollegeImage-01.png",
    chips: [
      {
        label: "Nearest",
        fill: "radial-gradient(ellipse 111.11% 111.11% at 50% 5.56%, #FF84A7 0%, #DC436F 100%)",
        border: "#FF336D",
      },
      {
        label: "Registration: Alegria",
        fill: "radial-gradient(ellipse 98.87% 97.77% at 50% 0.75%, #FFCE84 0%, #DC6F43 100%)",
        border: "#DE7E00",
      },
    ],
  },
  {
    id: "engineering",
    name: "Pillai College of Engineering, New Panvel",
    image: "/images/CollegeImage-03.png",
    chips: [
      {
        label: "Closed",
        /* Match other chips’ punch — washed #FFDDDD read as broken/off */
        fill: "radial-gradient(ellipse 111.11% 111.11% at 50% 5.56%, #FF8484 0%, #E02424 100%)",
        border: "#EA0000",
      },
    ],
  },
  {
    id: "hoc",
    name: "Pillai HOC, Rasayani",
    image: "/images/CollegeImage-02.png",
    chips: [
      {
        label: "On Going: Hackethon",
        fill: "radial-gradient(ellipse 106.97% 101.53% at 50% 0%, #9884FF 0%, #5D43DC 100%)",
        border: "#2A00FC",
      },
    ],
  },
];
