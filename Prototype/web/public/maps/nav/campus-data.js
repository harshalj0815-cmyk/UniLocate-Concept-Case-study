/*
 * UniLocate campus — layered map data.
 *
 * Everything is in map pixels (2184 × 2114), the same frame as the Paper floor art,
 * so all three floors stack exactly on top of each other.
 *
 * Layers
 *   paths[floor].indoor   corridor centre-lines inside the building
 *   paths[floor].outer    outdoor walkways (compound bands, road, field approaches)
 *   places                rooms / classrooms / open spaces (searchable destinations)
 *   washrooms             searchable, grouped as their own layer
 *   exits                 campus gates
 *   verticals             lifts + stairs; one entry per shaft with an access point per floor
 *
 * A chain ["a", "b", "c"] means a–b and b–c are walkable segments.
 * Doors and access points are not wired by hand: the router snaps each one onto the
 * nearest path segment on its floor.
 */
window.UL_CAMPUS = {
  size: { w: 2184, h: 2114 },
  metersPerPx: 0.22,

  floors: [
    { id: "ground", label: "Ground", short: "G", level: 0, page: "ground-floor-map.html" },
    { id: "first", label: "1st floor", short: "1", level: 1, page: "first-floor-map.html" },
    { id: "second", label: "2nd floor", short: "2", level: 2, page: "second-floor-map.html" },
  ],

  /* Outer south path, aligned with Placement Cell door (714, 1313) */
  defaultStart: { floor: "ground", x: 714, y: 1416, label: "Near Placement Cell" },

  paths: {
    ground: {
      nodes: {
        // compound bands (outer)
        nbW: [490, 515], nb763: [763, 515], nbRoad: [1156, 515],
        wb610: [490, 610], wb800: [490, 800], wb1010: [490, 1010], wb1306: [490, 1306],
        wbSW: [500, 1350], sbW: [560, 1414], sb587: [587, 1416], sbFees: [612, 1416], sb779: [779, 1416],
        sb931: [931, 1416], sbE: [1000, 1416], seLink: [1012, 1382],
        // east road
        road430: [1156, 430], road334: [1156, 334], road593: [1156, 593], road636: [1156, 636],
        road983: [1156, 983], road1050: [1156, 1050], road1382: [1156, 1382],
        road1513: [1156, 1513], road1748: [1156, 1748],
        // field approaches + turf ring
        stageApproach: [1218, 593], stageFront: [1586, 593],
        courtFront: [1212, 1050], machineYard: [1078, 636],
        turf1: [1300, 1390], turf2: [1500, 1402], turf3: [1610, 1410], turf4: [1652, 1460], turf4b: [1674, 1480], turf4c: [1688, 1500],
        turf5: [1692, 1520], turf6: [1710, 1600], turf7: [1720, 1700], turf8: [1712, 1748],
        sBand1685: [1685, 1748], gateSE: [1685, 1784], gateS: [1128, 1513], gymFront: [1196, 430],
        canteenW: [511, 610], feesS: [612, 1389],
        // north wing
        c763a: [763, 650], c763b: [763, 720], liftBW: [704, 650],
        aw0: [771, 720], c927: [927, 720], c1000: [1000, 720],
        j710: [710, 727], j698: [699, 728], j592: [592, 733],
        aw1: [771, 742], aw2: [762, 760], aw3: [759, 780], aw4: [765, 800], aw5: [775, 820],
        // main corridor y≈831
        w566a: [566, 800], m566: [566, 831], m778: [778, 831], m785: [785, 831],
        m927: [927, 831], m977: [977, 831], m1013: [1013, 831],
        t977: [977, 878], t953: [953, 878], t930: [930, 878],
        // south-of-library corridor y≈983 (runs out to the road)
        s565: [565, 983], s785: [785, 983], s931: [931, 983], s977: [977, 983],
        // west/east ribs down to the south corridor
        l565: [565, 1010], l587: [587, 1025],
        c587: [587, 1306], c779: [779, 1306], c779n: [779, 1225], c931: [931, 1306], c1000s: [1000, 1306],
      },
      indoor: [
        ["nb763", "c763a", "c763b"],
        ["liftBW", "c763a"],
        ["j592", "j698", "j710", "c763b", "aw0", "c927", "c1000"],
        ["aw0", "aw1", "aw2", "aw3", "aw4", "aw5", "m778"],
        ["c927", "m927"],
        ["wb800", "w566a", "m566", "m778", "m785", "m927", "m977", "m1013"],
        ["m977", "t977", "s977"],
        ["t977", "t953", "t930"],
        ["m566", "s565", "l565"],
        ["m785", "s785"],
        ["s565", "s785", "s931", "s977", "road983"],
        ["wb1010", "l565", "l587", "c587"],
        ["s931", "c931"],
        ["wb1306", "c587", "c779", "c931", "c1000s"],
        ["c779", "c779n"],
        ["c587", "sb587"],
        ["c931", "sb931"],
      ],
      outer: [
        ["nbW", "nb763", "nbRoad"],
        ["nbW", "wb610", "wb800", "wb1010", "wb1306", "wbSW", "sbW", "sb587", "sbFees", "sb779", "sb931", "sbE", "seLink", "road1382"],
        ["nbRoad", "road593", "road636", "road983", "road1050", "road1382", "road1513", "road1748"],
        ["road1748", "sBand1685", "turf8"],
        ["road1382", "turf1", "turf2", "turf3", "turf4", "turf4b", "turf4c", "turf5", "turf6", "turf7", "turf8"],
        ["road593", "stageApproach"],
        ["road1050", "courtFront"],
        ["road636", "machineYard"],
        ["wb610", "canteenW"],
        ["sbFees", "feesS"],
        ["sBand1685", "gateSE"],
        { unpaved: true, chain: ["road1513", "gateS"] },
        { unpaved: true, chain: ["stageApproach", "stageFront"] },
        { unpaved: true, chain: ["nbRoad", "road430", "road334"] },
        { unpaved: true, chain: ["road430", "gymFront"] },
      ],
    },

    first: {
      nodes: {
        liftBW: [704, 649], c763a: [763, 649], c763b: [763, 721],
        aw0: [770, 721], c927: [927, 721],
        aw1: [768, 745], aw2: [762, 762], aw3: [759, 780], aw4: [765, 800], aw5: [776, 822],
        m566: [566, 833], m684: [684, 833], m780: [780, 833], m791: [791, 833],
        m927: [927, 833], m978: [978, 833], m995: [995, 833],
        t978: [978, 880], t953: [953, 880], t940: [940, 880],
        s684: [684, 985], s797: [797, 985], x791s: [791, 930],
        w566s: [566, 1000], w577: [577, 1013], w588: [588, 1030],
        c527: [527, 1307], c588: [588, 1307], c588s: [588, 1365],
        c780: [780, 1307], c780n: [780, 1225],
        c931: [931, 1307], c931n: [931, 1025], c931s: [931, 1365], c990: [990, 1307],
      },
      indoor: [
        ["liftBW", "c763a", "c763b", "aw0", "c927", "m927"],
        ["aw0", "aw1", "aw2", "aw3", "aw4", "aw5", "m780"],
        ["m566", "m684", "m780", "m791", "m927", "m978", "m995"],
        ["m978", "t978", "t953", "t940"],
        ["m684", "s684", "s797"],
        ["m791", "x791s"],
        ["m566", "w566s", "w577", "w588", "c588", "c588s"],
        ["c527", "c588", "c780", "c931", "c990"],
        ["c780", "c780n"],
        ["c931n", "c931", "c931s"],
      ],
      outer: [],
    },

    second: {
      nodes: {
        g583: [583, 649], g592: [592, 649], liftBW: [704, 649], c763a: [763, 649], c763b: [763, 721],
        aw0: [770, 721], c927: [927, 721],
        aw1: [768, 745], aw2: [762, 762], aw3: [759, 780], aw4: [765, 800], aw5: [776, 822],
        m566: [566, 833], m592: [592, 833], m684: [684, 833], m780: [780, 833],
        m927: [927, 833], m978: [978, 833], m1019: [1019, 833], j604: [1019, 604],
        t978: [978, 880], t953: [953, 880], t940: [940, 880], t978s: [978, 970], e931: [931, 970],
        s684: [684, 985], s797: [797, 985],
        w566s: [566, 1000], w577: [577, 1013], w588: [588, 1030],
        c527: [527, 1307], c588: [588, 1307], c588s: [588, 1365],
        c931: [931, 1307], c931s: [931, 1365], c990: [990, 1307],
      },
      indoor: [
        ["g583", "g592", "liftBW", "c763a", "c763b", "aw0", "c927", "m927"],
        ["g592", "m592"],
        ["aw0", "aw1", "aw2", "aw3", "aw4", "aw5", "m780"],
        ["m566", "m592", "m684", "m780", "m927", "m978", "m1019", "j604"],
        ["m978", "t978", "t978s", "e931", "c931", "c931s"],
        ["t978", "t953", "t940"],
        ["c931", "c990"],
        ["m684", "s684", "s797"],
        ["m566", "w566s", "w577", "w588", "c588", "c588s"],
        ["c527", "c588"],
      ],
      outer: [],
    },
  },

  verticals: [
    {
      id: "lift-a", kind: "lift", name: "Lift A", near: "next to OC / Exam Cell",
      icon: [953, 855],
      access: { ground: [953, 878], first: [953, 880], second: [953, 880] },
    },
    {
      id: "lift-b", kind: "lift", name: "Lift B", near: "beside Canteen / Pimsr Library",
      icon: [716, 627],
      access: { ground: [716, 650], first: [716, 649], second: [716, 649] },
    },
    {
      id: "lift-c", kind: "lift", name: "Lift C", near: "west of the Atrium",
      icon: [607, 751],
      // On the 1st floor this shaft only opens inside Pimsr Library.
      access: { ground: [606, 733], second: [591, 750] },
    },
    {
      id: "lift-d", kind: "lift", name: "Lift D", near: "west wing, by Print Shop / L102",
      icon: [532, 852],
      access: { ground: [552, 852], first: [552, 852], second: [552, 852] },
    },
    {
      id: "lift-e", kind: "lift", name: "Lift E", near: "south-west corner",
      icon: [536, 1358],
      access: { ground: [526, 1382], first: [588, 1352], second: [588, 1352] },
    },
    {
      id: "lift-f", kind: "lift", name: "Lift F", near: "south-east corner",
      icon: [978, 1358],
      access: { ground: [990, 1380], first: [931, 1352], second: [931, 1352] },
    },
    // Stair plates are one-way: `out` = arrow points away from the corridor (go in here to
    // change floor), `in` = arrow points at the corridor (you come out here).
    // A plain [x, y] is a single plate used both ways.
    {
      id: "stairs-east", kind: "stairs", name: "East stairs", near: "behind Architecture Wing",
      icon: [964, 776],
      access: {
        // The ↑ plate opens onto the y≈720 corridor only on the ground floor.
        ground: { out: [927, 774], in: [[982, 831], [982, 720]] },
        first: { out: [927, 774], in: [982, 833] },
        second: { out: [927, 774], in: [982, 833] },
      },
    },
    {
      id: "stairs-oc", kind: "stairs", name: "OC stairs", near: "below Lift A",
      icon: [953, 917],
      access: {
        ground: [955, 878],
        first: { out: [962, 880], in: [945, 880] },
        second: { out: [962, 880], in: [945, 880] },
      },
    },
    {
      id: "stairs-canteen", kind: "stairs", name: "Canteen stairs", near: "next to Lift B",
      icon: [738, 684],
      access: {
        ground: [738, 650],
        first: { out: [742, 649], in: [720, 649] },
        second: { out: [742, 649], in: [720, 649] },
      },
    },
    {
      id: "stairs-west", kind: "stairs", name: "West stairs", near: "below Lift D",
      icon: [538, 900],
      access: {
        ground: { out: [564, 877], in: [564, 906] },
        first: { out: [566, 877], in: [566, 906] },
        second: { out: [566, 877], in: [566, 906] },
      },
    },
    {
      id: "stairs-stage", kind: "stairs", name: "Stage stairs", near: "beside Lift C",
      icon: [558, 750],
      access: { ground: [560, 790], second: { out: [592, 753], in: [592, 736] } },
    },
    {
      id: "stairs-sw", kind: "stairs", name: "South-west stairs", near: "end of the R / west wing",
      icon: [575, 1330],
      access: {
        ground: { out: [560, 1306], in: [587, 1338] },
        first: { out: [560, 1307], in: [588, 1338] },
        second: { out: [560, 1307], in: [588, 1338] },
      },
    },
    {
      id: "stairs-se", kind: "stairs", name: "South-east stairs", near: "end of the T / workshop wing",
      icon: [945, 1330],
      access: {
        ground: { out: [958, 1306], in: [931, 1338] },
        first: { out: [958, 1307], in: [931, 1338] },
        second: { out: [958, 1307], in: [931, 1338] },
      },
    },
    {
      id: "stairs-machine", kind: "stairs", name: "Machine Workshop stairs", near: "Biotech Lab / J wing",
      icon: [1050, 616],
      access: { ground: [1078, 636], second: { out: [1019, 614], in: [1019, 634] } },
    },
  ],

  // Campus sections for the map filter. Footprints are the same on every floor;
  // polygons are [x, y] map points.
  sections: {
    wings: [
      { id: "wing-j", name: "J-Wing", poly: [[962, 545], [1076, 545], [1076, 846], [1011, 846], [1011, 679], [962, 679]] },
      { id: "wing-p", name: "P-Wing", poly: [[926, 828], [1045, 828], [1045, 1013], [926, 1013]] },
      { id: "wing-t", name: "T-Wing", poly: [[933, 1022], [1000, 1022], [1000, 1297], [933, 1297]] },
      { id: "wing-s", name: "S-Wing", poly: [[870, 1202], [870, 1238], [927, 1238], [927, 1384], [592, 1384], [592, 1238], [646, 1238], [646, 1202]] },
      { id: "wing-o", name: "O-Wing", poly: [[686, 828], [806, 828], [806, 990], [834, 990], [834, 1117], [710, 1117], [710, 990], [686, 990]] },
      { id: "wing-l", name: "L-Wing", poly: [[568, 828], [686, 828], [686, 990], [568, 990]] },
      { id: "wing-g", name: "G-Wing", poly: [[520, 578], [758, 578], [758, 728], [520, 728]] },
      { id: "wing-r", name: "R-Wing", poly: [[518, 1034], [583, 1034], [583, 1297], [518, 1297]] },
    ],
    buildings: [
      // The J-Wing strip has no label of its own in the building plan; it joins the PCACS column.
      // The O-Wing rooms over the stilt area are PCACS too, so the stilt block is included.
      {
        id: "bldg-pcacs",
        name: "PCACS",
        poly: [[966, 543], [1076, 543], [1076, 1020], [926, 1020], [926, 990], [834, 990], [834, 1117], [710, 1117], [710, 990], [516, 990], [516, 824], [945, 824], [945, 679], [966, 679]],
      },
      { id: "bldg-pica", name: "PICA", poly: [[767, 587], [945, 587], [945, 726], [767, 726]] },
      { id: "bldg-pimsr", name: "PIMSR", poly: [[521, 578], [760, 578], [760, 728], [521, 728]] },
      { id: "bldg-pce", name: "PCE", poly: [[1000, 1022], [1000, 1384], [518, 1384], [518, 1034], [592, 1034], [592, 1238], [646, 1238], [646, 1202], [870, 1202], [870, 1238], [927, 1238], [927, 1022]] },
    ],
  },

  exits: [
    { id: "gate-west", name: "West Gate", aliases: ["Entry Exit Gate", "main gate"], floor: "ground", rect: [455, 491, 13, 88], doors: [[466, 535]] },
    { id: "gate-south", name: "South Gate", aliases: ["Entry Exit Gate"], floor: "ground", rect: [1098, 1469, 13, 88], doors: [[1112, 1513]] },
    { id: "gate-southeast", name: "South-East Gate", aliases: ["Entry Exit Gate", "turf gate"], floor: "ground", rect: [1641, 1799, 88, 13], doors: [[1685, 1797]] },
  ],

  washrooms: [
    { id: "wc-g-arch", name: "Washroom", near: "Architecture Wing", floor: "ground", rect: [924, 687, 52, 25], doors: [[950, 714]] },
    { id: "wc-g-canteen", name: "Washroom", near: "Canteen / Lift B", floor: "ground", rect: [728, 599, 28, 42], doors: [[742, 643]] },
    { id: "wc-g-east", name: "Washroom", near: "Machine Workshop", floor: "ground", rect: [984, 845, 59, 41], doors: [[982, 869]] },
    { id: "wc-g-west", name: "Washroom", near: "west wing", floor: "ground", rect: [522, 1038, 57, 60], doors: [[580, 1068]] },
    { id: "wc-g-sw", name: "Washroom", near: "Enquiry Desk (west)", floor: "ground", rect: [595, 1243, 56, 56], doors: [[623, 1300]] },
    { id: "wc-g-se", name: "Washroom", near: "Enquiry Desk (east)", floor: "ground", rect: [864, 1243, 58, 56], doors: [[893, 1299]] },

    { id: "wc-1-arch", name: "Washroom", near: "Architecture Wing", floor: "first", rect: [936, 683, 25, 52], doors: [[934, 723]] },
    { id: "wc-1-pimsr", name: "Washroom", near: "Pimsr Library / Lift B", floor: "first", rect: [728, 599, 28, 42], doors: [[742, 644]] },
    { id: "wc-1-west", name: "Washroom", near: "R wing", floor: "first", rect: [522, 1039, 57, 60], doors: [[580, 1069]] },
    { id: "wc-1-sw", name: "Washroom", near: "S101", floor: "first", rect: [595, 1243, 56, 56], doors: [[623, 1300]] },
    { id: "wc-1-se", name: "Washroom", near: "S102", floor: "first", rect: [864, 1243, 58, 56], doors: [[893, 1300]] },

    { id: "wc-2-arch", name: "Washroom", near: "Architecture Wing", floor: "second", rect: [936, 683, 25, 52], doors: [[934, 723]] },
    { id: "wc-2-p", name: "Washroom", near: "P wing", floor: "second", rect: [986, 840, 57, 48], doors: [[985, 865]] },
    { id: "wc-2-g", name: "Washroom", near: "G wing / Lift B", floor: "second", rect: [706, 599, 51, 42], doors: [[734, 642]] },
    { id: "wc-2-west", name: "Washroom", near: "R wing", floor: "second", rect: [522, 1039, 57, 60], doors: [[578, 1059], [578, 1085]] },
  ],

  places: [
    // ── Ground ─────────────────────────────────────────────
    { id: "g-canteen", name: "Canteen", type: "facility", floor: "ground", rect: [524, 579, 231, 147], doors: [[521, 610], [703, 649]] },
    { id: "g-arch", name: "Architecture Wing", type: "facility", floor: "ground", rect: [772, 599, 171, 114], doors: [[906, 713]] },
    { id: "g-machine", name: "Machine Workshop", type: "facility", floor: "ground", rect: [966, 547, 107, 297], doors: [[1011, 831]] },
    { id: "g-library", name: "Library", type: "facility", floor: "ground", rect: [573, 839, 203, 136], doors: [[701, 837], [703, 976]] },
    { id: "g-oc", name: "OC", aliases: ["Oc"], type: "facility", floor: "ground", rect: [796, 839, 128, 136], doors: [[794, 905]] },
    { id: "g-print", name: "Print Shop", type: "facility", floor: "ground", rect: [518, 936, 36, 37], doors: [[555, 946]] },
    { id: "g-stage", name: "Stage", type: "facility", floor: "ground", rect: [583, 763, 36, 61], doors: [[575, 800]] },
    { id: "g-atrium", name: "Atrium", type: "open", floor: "ground", rect: [619, 730, 293, 94], doors: [[759, 780]] },
    { id: "g-stilt", name: "Stilt area", type: "open", floor: "ground", rect: [712, 994, 120, 122], doors: [[772, 985]] },
    { id: "g-quad", name: "Quad", type: "open", floor: "ground", rect: [579, 994, 343, 247], doors: [[650, 985]] },
    { id: "g-enquiry", name: "Enquiry Desk", type: "office", floor: "ground", rect: [733, 1255, 43, 45], doors: [[753, 1300]] },
    // Fees Counter and Placement Cell share one block in the art; split for tapping.
    { id: "g-fees", name: "Fees Counter", type: "office", floor: "ground", rect: [597, 1314, 67, 62], doors: [[612, 1377], [621, 1313]] },
    { id: "g-placement", name: "Placement Cell", type: "office", floor: "ground", rect: [664, 1314, 67, 62], doors: [[714, 1313]] },
    { id: "g-workshop", name: "Workshop", type: "facility", floor: "ground", rect: [938, 1088, 57, 212], doors: [[937, 1107], [937, 1276]] },
    { id: "g-gym", name: "Gym Khana", aliases: ["Gymkhana", "gym"], type: "facility", floor: "ground", rect: [1208, 379, 289, 100], doors: [[1206, 430]] },
    { id: "g-workshops", name: "Workshops", type: "facility", floor: "ground", rect: [1176, 303, 321, 62], doors: [[1174, 334]] },
    { id: "g-main-stage", name: "Main Stage", type: "open", floor: "ground", rect: [1590, 520, 86, 144], doors: [[1588, 593]] },
    { id: "g-court", name: "Multi purpose court", aliases: ["MPC", "basketball"], type: "open", floor: "ground", rect: [1214, 817, 259, 496], doors: [[1213, 1050]] },
    { id: "g-turf", name: "Football Turf", aliases: ["ground", "football"], type: "open", floor: "ground", rect: [1189, 1409, 517, 326], doors: [[1300, 1408]] },

    // ── 1st floor ──────────────────────────────────────────
    { id: "1-pimsr", name: "Pimsr Library", type: "facility", floor: "first", rect: [524, 579, 231, 162], doors: [[704, 649]] },
    { id: "1-arch", name: "Architecture Wing", type: "facility", floor: "first", rect: [772, 599, 164, 114], doors: [[771, 687], [879, 714]] },
    { id: "1-exam", name: "Exam Cell", type: "office", floor: "first", rect: [798, 840, 63, 48], doors: [[829, 838]] },
    { id: "1-l1", name: "L1", type: "classroom", floor: "first", rect: [798, 889, 62, 86], doors: [[796, 922]] },
    { id: "1-l2", name: "L2", type: "classroom", floor: "first", rect: [862, 839, 63, 153], doors: [[909, 838]] },
    { id: "1-o101", name: "O101", type: "classroom", floor: "first", rect: [688, 839, 96, 40], doors: [[688, 856]] },
    { id: "1-o102", name: "O102", type: "classroom", floor: "first", rect: [688, 879, 96, 97], doors: [[688, 891], [688, 960]] },
    { id: "1-o103", name: "O103", type: "classroom", floor: "first", rect: [712, 993, 60, 122], doors: [[759, 992]] },
    { id: "1-o104", name: "O104", type: "classroom", floor: "first", rect: [772, 993, 60, 122], doors: [[784, 992]] },
    { id: "1-l101", name: "L101", type: "classroom", floor: "first", rect: [627, 839, 53, 153], doors: [[680, 853], [680, 973]] },
    { id: "1-l102", name: "L102", type: "classroom", floor: "first", rect: [573, 839, 53, 43], doors: [[571, 851]] },
    { id: "1-l103", name: "L103", type: "classroom", floor: "first", rect: [573, 882, 54, 34], doors: [[572, 892]] },
    { id: "1-l104", name: "L104", type: "classroom", floor: "first", rect: [573, 915, 54, 34], doors: [[572, 925]] },
    { id: "1-vp", name: "Vice Principal Cabin", aliases: ["V- Principle Cabin", "VP"], type: "office", floor: "first", rect: [573, 949, 54, 43], doors: [[571, 973]] },
    { id: "1-concession", name: "Concession Desk", aliases: ["Consetition desk"], type: "office", floor: "first", rect: [518, 936, 41, 37], doors: [[558, 944]] },
    { id: "1-r101", name: "R101", type: "classroom", floor: "first", rect: [522, 1099, 57, 60], doors: [[579, 1137]] },
    { id: "1-r102", name: "R102", type: "classroom", floor: "first", rect: [522, 1160, 57, 60], doors: [[579, 1202]] },
    { id: "1-r103", name: "R103", type: "classroom", floor: "first", rect: [522, 1220, 57, 80], doors: [[579, 1276]] },
    { id: "1-t101", name: "T101", type: "classroom", floor: "first", rect: [938, 1028, 57, 60], doors: [[937, 1047]] },
    { id: "1-t102", name: "T102", type: "classroom", floor: "first", rect: [938, 1088, 57, 60], doors: [[937, 1106]] },
    { id: "1-t103", name: "T103", type: "classroom", floor: "first", rect: [938, 1148, 57, 60], doors: [[938, 1166]] },
    { id: "1-t104", name: "T104", type: "classroom", floor: "first", rect: [938, 1208, 57, 89], doors: [[938, 1282]] },
    { id: "1-s101", name: "S101", type: "classroom", floor: "first", rect: [651, 1210, 82, 89], doors: [[673, 1299]] },
    { id: "1-s102", name: "S102", type: "classroom", floor: "first", rect: [783, 1210, 82, 89], doors: [[843, 1299]] },

    // ── 2nd floor ──────────────────────────────────────────
    { id: "2-g201", name: "G201", type: "classroom", floor: "second", rect: [618, 578, 85, 62], doors: [[691, 641]] },
    { id: "2-g203", name: "G203", type: "classroom", floor: "second", rect: [532, 578, 86, 62], doors: [[606, 641]] },
    { id: "2-staff", name: "Staff room", type: "office", floor: "second", rect: [532, 640, 51, 85], doors: [[583, 651]] },
    { id: "2-g202", name: "G202", type: "classroom", floor: "second", rect: [601, 660, 102, 62], doors: [[611, 659], [691, 659]] },
    { id: "2-arch", name: "Architecture Wing", type: "facility", floor: "second", rect: [772, 599, 164, 114], doors: [[771, 687], [879, 714]] },
    { id: "2-biotech", name: "Biotech Lab", type: "lab", floor: "second", rect: [966, 547, 107, 53], doors: [[1020, 601]] },
    { id: "2-j203", name: "J203", type: "classroom", floor: "second", rect: [1025, 648, 47, 64], doors: [[1025, 680]] },
    { id: "2-j202", name: "J202", type: "classroom", floor: "second", rect: [1025, 712, 47, 64], doors: [[1025, 744]] },
    { id: "2-j201", name: "J201", type: "classroom", floor: "second", rect: [1025, 776, 47, 64], doors: [[1025, 808]] },
    { id: "2-l3", name: "L3", type: "classroom", floor: "second", rect: [862, 839, 63, 153], doors: [[909, 838]] },
    { id: "2-exam", name: "Exam Cell", type: "office", floor: "second", rect: [807, 840, 54, 107], doors: [[829, 838]] },
    { id: "2-o201", name: "O201", type: "classroom", floor: "second", rect: [688, 839, 119, 40], doors: [[688, 856]] },
    { id: "2-o202", name: "O202", type: "classroom", floor: "second", rect: [688, 879, 119, 97], doors: [[688, 891], [688, 960]] },
    { id: "2-conf", name: "Conference Hall", type: "facility", floor: "second", rect: [627, 839, 53, 110], doors: [[680, 853]] },
    { id: "2-hod", name: "HOD Room", type: "office", floor: "second", rect: [627, 949, 54, 43], doors: [[680, 973]] },
    { id: "2-l202", name: "L202", type: "classroom", floor: "second", rect: [573, 839, 53, 43], doors: [[571, 851]] },
    { id: "2-l203", name: "L203", type: "classroom", floor: "second", rect: [573, 882, 54, 34], doors: [[572, 892]] },
    { id: "2-l204", name: "L204", type: "classroom", floor: "second", rect: [573, 915, 54, 34], doors: [[572, 925]] },
    { id: "2-vp", name: "Vice Principal Cabin", aliases: ["V- Principle Cabin", "VP"], type: "office", floor: "second", rect: [573, 949, 54, 43], doors: [[571, 973]] },
    { id: "2-concession", name: "Concession Desk", aliases: ["Consetition desk"], type: "office", floor: "second", rect: [518, 936, 41, 37], doors: [[558, 944]] },
    { id: "2-o203", name: "O203", type: "classroom", floor: "second", rect: [712, 993, 60, 122], doors: [[759, 992]] },
    { id: "2-o204", name: "O204", type: "classroom", floor: "second", rect: [772, 993, 60, 122], doors: [[784, 992]] },
    { id: "2-r201", name: "R201", type: "classroom", floor: "second", rect: [522, 1099, 57, 60], doors: [[579, 1137]] },
    { id: "2-r202", name: "R202", type: "classroom", floor: "second", rect: [522, 1160, 57, 60], doors: [[579, 1202]] },
    { id: "2-r203", name: "R203", type: "classroom", floor: "second", rect: [522, 1220, 57, 80], doors: [[579, 1276]] },
    { id: "2-t201", name: "T201", type: "classroom", floor: "second", rect: [938, 1028, 57, 60], doors: [[937, 1047]] },
    { id: "2-t202", name: "T202", type: "classroom", floor: "second", rect: [938, 1088, 57, 60], doors: [[937, 1106]] },
    { id: "2-t203", name: "T203", type: "classroom", floor: "second", rect: [938, 1148, 57, 60], doors: [[938, 1166]] },
    { id: "2-t204", name: "T204", type: "classroom", floor: "second", rect: [938, 1208, 57, 89], doors: [[938, 1282]] },
    { id: "2-p203", name: "P203", type: "classroom", floor: "second", rect: [986, 888, 57, 64], doors: [[985, 899], [985, 940]] },
    { id: "2-p202", name: "P202", type: "classroom", floor: "second", rect: [986, 952, 57, 68], doors: [[985, 978]] },
    // Paper labels this small room "P203" as well; kept so search still finds it.
    { id: "2-p203-annex", name: "P203", near: "annex by T201", type: "classroom", floor: "second", rect: [939, 989, 47, 39], doors: [[948, 988]] },
    { id: "2-pce", name: "PCE Library", type: "facility", floor: "second", rect: [597, 1210, 321, 166], doors: [[596, 1307], [920, 1307]] },
  ],
};
