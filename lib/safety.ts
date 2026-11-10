import type { SafetyTopic } from "./schemas";

export type SafetyText = {
  title: string;
  body: string;
  /** "danger" for things that can kill or maim; "warning" for injury risks. */
  tone: "danger" | "warning";
};

/** Standard safety texts. Teardowns pick topics and can add a job-specific note. */
export const SAFETY: Record<SafetyTopic, SafetyText> = {
  "jack-stands": {
    title: "Never work under a car held up only by a jack",
    body: "A jack is for lifting, not holding. Rest the car on axle stands rated for its weight, on hard level ground, at the support points shown in the manual. Chock the wheels that stay on the ground, and give the car a firm push before you reach underneath.",
    tone: "danger",
  },
  "battery-disconnect": {
    title: "Disconnect the 12 V battery",
    body: "Before working on electrical parts, remove the negative (−) terminal first and keep the cable away from the post. Reconnect it last. Afterwards you may need to reset the clock, radio and electric windows.",
    tone: "warning",
  },
  "hot-fluids": {
    title: "Hot fluids and parts can burn",
    body: "Coolant, oil, brake fluid and the exhaust can stay hot enough to burn long after a drive. Never open a hot cooling system. Wear gloves and eye protection, catch fluids in a pan, and take them to a recycling point.",
    tone: "warning",
  },
  airbags: {
    title: "Airbags can deploy with great force",
    body: "Don't touch airbag modules or yellow airbag connectors unless the job needs it. If it does, disconnect the battery and wait the time given in the manual first. Never probe airbag wiring.",
    tone: "danger",
  },
  "ev-high-voltage": {
    title: "High voltage in hybrids and EVs",
    body: "Hybrid and electric cars carry hundreds of volts in orange cables and parts with high-voltage labels. This can kill. Never cut, unplug or probe them. Work on them needs training and insulated tools.",
    tone: "danger",
  },
  "brake-dust": {
    title: "Don't breathe brake dust",
    body: "Clean brake parts with brake cleaner and a cloth, never with compressed air. Wear a dust mask and gloves, and wash your hands afterwards.",
    tone: "warning",
  },
  "eye-protection": {
    title: "Wear eye protection",
    body: "Rust, springs, clips and fluids can fly. Safety glasses are cheap; eyes are not.",
    tone: "warning",
  },
  "spring-tension": {
    title: "Springs store energy",
    body: "Coil springs and belt tensioners are under load. Release them slowly with the correct tool and keep fingers out of pinch points.",
    tone: "warning",
  },
};
